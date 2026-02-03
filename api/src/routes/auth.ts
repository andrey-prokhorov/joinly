// endpoint som hanterar inloggning
import bcrypt from "bcryptjs";
import { type Response, Router } from "express";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import config from "../config.js";
import db from "../db/database.js";
import { type AuthRequest, authenticateToken } from "../middleware/auth.js";
// validera eposten
import { isValidEmail } from "../utils/validators.js";

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
	"$2b$12$K8HpHfKxMvYwJQpCqWKMqeSN5.5kkNFnRhKYqTvqL9CxvM0VxNKXG";

// RATE LIMITING (Brute-force skydd)
// ----------------------------------
// Vi använder TVÅ rate limiters för bättre skydd:
// 1. Per IP-adress - stoppar enkel brute-force
// 2. Per email - stoppar distribuerade attacker (via proxies/botnets)

// Rate limiter per IP-adress
const loginLimiterByIp = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minuter
	max: 10, // max 10 försök per IP (lite högre för delade nätverk)
	message: {
		message: "För många inloggningsförsök. Försök igen om 15 minuter.",
	},
	standardHeaders: true,
	legacyHeaders: false,
});

// Rate limiter per email-adress (skyddar mot distribuerade attacker)
const loginLimiterByEmail = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minuter
	max: 5, // max 5 försök per email (striktare)
	message: {
		message:
			"För många inloggningsförsök för denna e-post. Försök igen om 15 minuter.",
	},
	keyGenerator: (req) => req.body?.email?.toLowerCase() || req.ip || "unknown",
	standardHeaders: true,
	legacyHeaders: false,
	skip: (req) => !req.body?.email, // skippa om ingen email finns
});

const router = Router();

// typ för User från databasen
interface DbUser {
	id: number;
	email: string;
	password_hash: string;
	name: string | null;
	role: string;
	created_at: string;
}

// POST /api/auth/login (med dubbel rate limiting: IP + email)
router.post("/login", loginLimiterByIp, loginLimiterByEmail, (req, res) => {
	const { email, password } = req.body;

	// enkel validering
	if (!email || !password) {
		return res.status(400).json({ message: "E-post och lösenord krävs." });
	}
	// validera epostformat
	if (!isValidEmail(email)) {
		return res.status(400).json({ message: "Ogiltig e-postadress." });
	}

	// hämta användare från databasen
	const user = db
		.prepare(
			"SELECT id, email, password_hash, name, role FROM users WHERE email = ?",
		)
		.get(email) as DbUser | undefined;

	if (!user) {
		// Kör bcrypt ändå för att förhindra timing attack (se DUMMY_HASH ovan)
		bcrypt.compareSync(password, DUMMY_HASH);
		return res.status(401).json({ message: "Ogiltig e-post eller lösenord." });
	}

	// verifiera lösenord
	const validPassword = bcrypt.compareSync(password, user.password_hash);

	if (!validPassword) {
		return res.status(401).json({ message: "Ogiltig e-post eller lösenord." });
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
		{ expiresIn: config.jwt.expiresIn } as jwt.SignOptions,
	);

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
	});
});

// GET /api/auth/me - returnera inloggad användare
router.get("/me", authenticateToken, (req: AuthRequest, res: Response) => {
	// authenticateToken har redan verifierat token och lagt user på req
	// Om vi kommer hit är användaren inloggad
	res.json({ user: req.user, message: "Användare är inloggad." });
});

export default router;
