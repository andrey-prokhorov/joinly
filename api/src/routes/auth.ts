import bcrypt from "bcryptjs"
import { type Response, Router } from "express"
import rateLimit, { ipKeyGenerator } from "express-rate-limit"
import jwt from "jsonwebtoken"
import { v4 as uuidv4 } from "uuid"
import config from "../config.js"
import db from "../db/database.js"
import { type AuthRequest, authenticateToken } from "../middleware/auth.js"
import {
	getEmailError,
	getNameError,
	getPasswordError,
	sanitizeName,
} from "../utils/validators.js"

// TIMING ATTACK PREVENTION
// --------------------------
// När någon försöker logga in mäter vi lösenordet med bcrypt.compare().
// Problemet: om användaren INTE finns hoppar vi över bcrypt → snabbt svar.
// Om användaren FINNS kör vi bcrypt → långsamt svar (100-300ms).
// En attackerare kan mäta svarstiden och räkna ut vilka email som finns!
//
// Lösning: vi kör ALLTID bcrypt, även om användaren inte finns.
// Då tar båda fallen lika lång tid och attacken fungerar inte.
const DUMMY_HASH =
	"$2b$12$K8HpHfKxMvYwJQpCqWKMqeSN5.5kkNFnRhKYqTvqL9CxvM0VxNKXG"

const uuid = uuidv4()

// RATE LIMITING (Brute-force skydd)
// ----------------------------------
// Funktion som skapar rate limiters med gemensam config.
// Används för både login och register med olika gränser.
// Login har även en separat email-baserad limiter (se nedan).
const createRateLimiter = (max: number, message: string) =>
	rateLimit({
		windowMs: 15 * 60 * 1000,
		max,
		message: { message },
		standardHeaders: true,
		legacyHeaders: false,
	})

const loginLimiterByIp = createRateLimiter(
	10,
	"För många inloggningsförsök. Försök igen om 15 minuter."
)
const registerLimiter = createRateLimiter(
	5,
	"För många registreringsförsök. Försök igen om 15 minuter."
)

// Rate limiter per email-adress vid Login (skyddar mot distribuerade attacker)
const loginLimiterByEmail = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minuter
	max: 5, // max 5 försök per email (striktare)
	message: {
		message:
			"För många inloggningsförsök för denna e-post. Försök igen om 15 minuter.",
	},
	keyGenerator: (req) =>
		req.body?.email?.toLowerCase() || ipKeyGenerator(req?.ip || uuid),
	standardHeaders: true,
	legacyHeaders: false,
	skip: (req) => !req.body?.email, // skippa om ingen email finns
})

const router = Router()

// typ för User från databasen
interface DbUser {
	id: string
	email: string
	password_hash: string
	name: string | null
	role: string
	created_at: string
}

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register new user
 *     description: Create a new user account with email, password, and name
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *                 description: User's email address (will be normalized to lowercase)
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "mySecurePassword123"
 *                 description: User's password (must meet security requirements)
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *                 description: User's display name
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Användare skapad. Du kan nu logga in."
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request - Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "E-post, lösenord och namn krävs."
 *       409:
 *         description: Conflict - Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "E-postadressen är redan registrerad."
 *       429:
 *         description: Too many requests - Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
// POST /api/auth/register
router.post("/register", registerLimiter, async (req, res) => {
	const { email, password, name } = req.body

	// typkontroll + validering (skyddar mot icke-strängvärden som ger 500 istället för 400)
	if (
		typeof email !== "string" ||
		typeof password !== "string" ||
		typeof name !== "string" ||
		!email ||
		!password ||
		!name
	) {
		return res.status(400).json({ message: "E-post, lösenord och namn krävs." })
	}

	// normalisera email (förhindrar dubbletter med olika casing)
	const normalizedEmail = email.trim().toLowerCase()

	// validera epostformat
	const emailError = getEmailError(normalizedEmail)
	if (emailError) {
		return res.status(400).json({ message: emailError })
	}

	// validera lösenord
	const passwordError = getPasswordError(password)
	if (passwordError) {
		return res.status(400).json({ message: passwordError })
	}

	// validera namn mot rå input först (avvisar t.ex. HTML-taggar med felmeddelande)
	// sanitering görs separat efter validering - bara för lagring
	const rawName = typeof name === "string" ? name.trim() : ""
	const nameError = getNameError(rawName)
	if (nameError) {
		return res.status(400).json({ message: nameError })
	}
	const sanitizedName = sanitizeName(rawName)

	try {
		// kolla om användaren redan finns
		const existingUser = db
			.prepare("SELECT id FROM users WHERE email = ?")
			.get(normalizedEmail) as { id: number } | undefined

		if (existingUser) {
			return res
				.status(409)
				.json({ message: "E-postadressen är redan registrerad." })
		}

		// hash lösenord (async för att inte blockera event loop)
		const passwordHash = await bcrypt.hash(password, 12)

		// spara användare i databasen
		const newUserId = uuidv4()
		const result = db
			.prepare(
				"INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, 'user')"
			)
			.run(newUserId, normalizedEmail, passwordHash, sanitizedName)

		if (result.changes === 0) {
			return res.status(500).json({ message: "Kunde inte skapa användare." })
		}
		// skapa jwt-token med id, email och role (för konsistens med /login)
		const token = jwt.sign(
			{ id: newUserId, email: normalizedEmail, role: "user" },
			config.jwt.secret,
			{ expiresIn: config.jwt.expiresIn } as jwt.SignOptions
		)
		//returnera 201 med message, token, user (id, email, name, role)
		res.status(201).json({
			message: "Användare skapad. Du kan nu logga in.",
			token,
			user: {
				id: newUserId,
				email: normalizedEmail,
				name: sanitizedName,
				role: "user",
			},
		})
	} catch (_error) {
		return res.status(500).json({ message: "Kunde inte skapa användare." })
	}
})

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate user with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 example: "mySecurePassword123"
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Inloggning lyckades."
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                   description: JWT token for authentication
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request - Missing or invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "E-post och lösenord krävs."
 *       401:
 *         description: Unauthorized - Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Ogiltig e-post eller lösenord."
 *       429:
 *         description: Too many requests - Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
// POST /api/auth/login (med dubbel rate limiting: IP + email)
router.post(
	"/login",
	loginLimiterByIp,
	loginLimiterByEmail,
	async (req, res) => {
		const { email, password } = req.body

		// typkontroll + validering (skyddar mot icke-strängvärden som ger 500 istället för 400)
		if (
			typeof email !== "string" ||
			typeof password !== "string" ||
			!email ||
			!password
		) {
			return res.status(400).json({ message: "E-post och lösenord krävs." })
		}

		// normalisera email (matcha hur register sparar)
		const normalizedEmail = email.trim().toLowerCase()

		// validera epostformat (samma check som register för konsistens)
		const emailError = getEmailError(normalizedEmail)
		if (emailError) {
			return res.status(400).json({ message: emailError })
		}

		// hämta användare från databasen
		const user = db
			.prepare(
				"SELECT id, email, password_hash, name, role FROM users WHERE email = ?"
			)
			.get(normalizedEmail) as DbUser | undefined

		if (!user) {
			// Kör bcrypt ändå för att förhindra timing attack (se DUMMY_HASH ovan)
			await bcrypt.compare(password, DUMMY_HASH)
			return res.status(401).json({ message: "Ogiltig e-post eller lösenord." })
		}

		// verifiera lösenord
		const validPassword = await bcrypt.compare(password, user.password_hash)

		if (!validPassword) {
			return res.status(401).json({ message: "Ogiltig e-post eller lösenord." })
		}

		// Skapa JWT-token
		// OBS: "as jwt.SignOptions" behövs pga ett känt typproblem i @types/jsonwebtoken
		// där expiresIn använder en "branded type" (StringValue) som inte accepterar vanlig string.
		// Detta är en vedertagen workaround, inte slarv.
		// Skapa JWT payload med samma struktur som user-objektet vi returnerar
		// Detta gör att /me och /login ger konsistent data
		const token = jwt.sign(
			{ id: user.id, email: user.email, role: user.role },
			config.jwt.secret,
			{ expiresIn: config.jwt.expiresIn } as jwt.SignOptions
		)

		// skicka token till klienten
		res.json({
			message: "Inloggning lyckades.",
			token,
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				role: user.role,
			},
		})
	}
)

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get current user
 *     description: Get information about the currently authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: "Användare är inloggad."
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Ogiltig eller saknad token."
 */
// GET /api/auth/me - returnera inloggad användare
router.get("/me", authenticateToken, (req: AuthRequest, res: Response) => {
	// authenticateToken har redan verifierat token och lagt user på req
	// Om vi kommer hit är användaren inloggad
	res.json({ user: req.user, message: "Användare är inloggad." })
})
/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Invalidate the current JWT token by adding it to the blacklist
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Utloggad."
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Ogiltig eller saknad token."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Kunde inte logga ut. Försök igen."
 */ // POST /api/auth/logout - invalidera token (lägg i blacklist)
router.post("/logout", authenticateToken, (req: AuthRequest, res: Response) => {
	// Hämta token från Authorization header
	// authenticateToken middleware garanterar att authHeader finns och token är giltig
	const authHeader = req.headers.authorization ?? ""
	const token = authHeader.replace(/^Bearer\s+/i, "").trim()

	// Defensiv check - bör aldrig triggas tack vare authenticateToken middleware
	if (!token) {
		return res.status(401).json({ message: "Ogiltig eller saknad token." })
	}

	// Hämta tokenens utgångstid från JWT payload (unix epoch i sekunder)
	// JWT exp är redan unix epoch - spara direkt utan formatkonvertering
	const decoded = jwt.decode(token) as { exp?: number }
	const expiresAt = decoded?.exp ?? Math.floor(Date.now() / 1000) + 86400

	// Lägg token i blacklist
	try {
		db.prepare(
			"INSERT OR IGNORE INTO token_blacklist (token, expires_at) VALUES (?, ?)"
		).run(token, expiresAt)
	} catch (_error) {
		return res
			.status(500)
			.json({ message: "Kunde inte logga ut. Försök igen." })
	}

	res.json({ message: "Utloggad." })
})

export default router
