// endpoint som hanterar inloggning
import bcrypt from "bcryptjs";
import { type Response, Router } from "express";
import jwt from "jsonwebtoken";
import config from "../config.js";
import db from "../db/database.js";
import { type AuthRequest, authenticateToken } from "../middleware/auth.js";
// validera eposten
import { isValidEmail } from "../utils/validators.js";

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

// POST /api/auth/login
router.post("/login", (req, res) => {
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
	const token = jwt.sign(
		{ userId: user.id, email: user.email, role: user.role },
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
