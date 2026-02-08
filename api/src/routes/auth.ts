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
	isValidEmail,
} from "../utils/validators.js"

// TIMING ATTACK PREVENTION
// --------------------------
// När någon försöker logga in mäter vi lösenordet med bcrypt.compareSync().
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
	id: number
	email: string
	password_hash: string
	name: string | null
	role: string
	created_at: string
}

// POST /api/auth/register
router.post("/register", registerLimiter, (req, res) => {
	const { email, password, name } = req.body

	// enkel validering
	if (!email || !password || !name) {
		return res.status(400).json({ message: "E-post, lösenord och namn krävs." })
	}

	// validera epostformat
	const emailError = getEmailError(email)
	if (emailError) {
		return res.status(400).json({ message: emailError })
	}

	// validera lösenord
	const passwordError = getPasswordError(password)
	if (passwordError) {
		return res.status(400).json({ message: passwordError })
	}

	// validera namn
	const nameError = getNameError(name)
	if (nameError) {
		return res.status(400).json({ message: nameError })
	}

	// kolla om användaren redan finns
	const existingUser = db
		.prepare("SELECT id FROM users WHERE email = ?")
		.get(email) as { id: number } | undefined

	if (existingUser) {
		return res
			.status(409)
			.json({ message: "E-postadressen är redan registrerad." })
	}

	// hash lösenord
	const passwordHash = bcrypt.hashSync(password, 12)

	// spara användare i databasen
	const result = db
		.prepare(
			"INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, 'user')"
		)
		.run(email, passwordHash, name)

	if (result.changes === 0) {
		return res.status(500).json({ message: "Kunde inte skapa användare." })
	}
	// hämta result.lastInsertRowid som är den nya användarens ID.
	const newUserId = result.lastInsertRowid as number
	// skapa jwt-token med id, email och role (för konsistens med /login)
	const token = jwt.sign(
		{ id: newUserId, email, role: "user" },
		config.jwt.secret,
		{ expiresIn: config.jwt.expiresIn } as jwt.SignOptions
	)
	//returnera 201 med message, token, user (id, email, name, role)
	res.status(201).json({
		message: "Användare skapad. Du kan nu logga in.",
		token,
		user: {
			id: newUserId,
			email,
			name,
			role: "user",
		},
	})
})

// POST /api/auth/login (med dubbel rate limiting: IP + email)
router.post("/login", loginLimiterByIp, loginLimiterByEmail, (req, res) => {
	const { email, password } = req.body

	// enkel validering
	if (!email || !password) {
		return res.status(400).json({ message: "E-post och lösenord krävs." })
	}
	// validera epostformat
	if (!isValidEmail(email)) {
		return res.status(400).json({ message: "Ogiltig e-postadress." })
	}

	// hämta användare från databasen
	const user = db
		.prepare(
			"SELECT id, email, password_hash, name, role FROM users WHERE email = ?"
		)
		.get(email) as DbUser | undefined

	if (!user) {
		// Kör bcrypt ändå för att förhindra timing attack (se DUMMY_HASH ovan)
		bcrypt.compareSync(password, DUMMY_HASH)
		return res.status(401).json({ message: "Ogiltig e-post eller lösenord." })
	}

	// verifiera lösenord
	const validPassword = bcrypt.compareSync(password, user.password_hash)

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
})

// GET /api/auth/me - returnera inloggad användare
router.get("/me", authenticateToken, (req: AuthRequest, res: Response) => {
	// authenticateToken har redan verifierat token och lagt user på req
	// Om vi kommer hit är användaren inloggad
	res.json({ user: req.user, message: "Användare är inloggad." })
})

export default router
