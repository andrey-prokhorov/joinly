// JWT middleware - skyddar routes som kräver inloggning
//
// Flöde:
// 1. Klient skickar header: "Authorization: Bearer <token>"
// 2. Vi extraherar token från headern
// 3. Vi verifierar token med samma hemliga nyckel som vi signerade med
// 4. Om giltig → lägg till user-info på req.user och fortsätt
// 5. Om ogiltig → svara 401

import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import config from "../config.js";

// ================================
// TYPER
// ================================

// Payload som finns inuti JWT-token (samma som vi skapade i login)
interface JwtPayload {
	userId: number;
	email: string;
	role: string;
}

// Utöka Express Request med vår user-property
// Detta gör att TypeScript förstår req.user
export interface AuthRequest extends Request {
	user?: JwtPayload;
}

// ================================
// MIDDLEWARE-FUNKTIONEN
// ================================

export const authenticateToken = (
	req: AuthRequest,
	res: Response,
	next: NextFunction,
): void => {
	// STEG 1: Hämta Authorization header
	// Format: "Bearer eyJhbGciOiJIUzI1NiIs..."
	const authHeader = req.headers.authorization;

	// STEG 2: Extrahera token (ta bort "Bearer " prefixet)
	const token = authHeader?.split(" ")[1];

	// STEG 3: Kolla om token finns
	if (!token) {
		res.status(401).json({ message: "Ingen token tillhandahållen." });
		return;
	}

	// STEG 4: Verifiera token
	try {
		// jwt.verify kastar error om token är ogiltig eller utgången
		const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

		// STEG 5: Lägg till user-info på request-objektet
		// Nu kan alla routes efter denna middleware komma åt req.user
		req.user = decoded;

		// STEG 6: Fortsätt till nästa middleware/route
		next();
	} catch (_error) {
		// Token ogiltig eller utgången
		res.status(401).json({ message: "Ogiltig eller utgången token." });
		return;
	}
};
