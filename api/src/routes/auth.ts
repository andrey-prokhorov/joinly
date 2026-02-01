// endpoint som hanterar inloggning

import bcrypt from "bcryptjs";
import { type Request, type Response, Router } from "express";
import jwt from "jsonwebtoken";
import config from "../config.js";
import db from "../db/database.js";
//Validera eposten
import { isValidEmail } from "../utils/validators.js";

const router = Router();

// Typ för User från databasen
interface DbUser {
	id: number;
	email: string;
	password_hash: string;
	name: string | null;
	role: string;
	created_at: string;
}

// POST /api/auth/login
router.post("/login", (req: Request, res: Response) => {
	const { email, password } = req.body;

	// Enkel validering
	if (!email || !password) {
		return res.status(400).json({ message: "E-post och lösenord krävs." });
	}
	// Validera epostformat
	if (!isValidEmail(email)) {
		return res.status(400).json({ message: "Ogiltig e-postadress." });
	}

	// Hämta användare från databasen
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

export default router;
