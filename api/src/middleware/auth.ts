// JWT middleware - skyddar routes som kräver inloggning
//
// Flöde:
// 1. Klient skickar header: "Authorization: Bearer <token>"
// 2. Vi extraherar token från headern
// 3. Vi verifierar token med samma hemliga nyckel som vi signerade med
// 4. Om giltig → lägg till user-info på req.user och fortsätt
// 5. Om ogiltig → svara 401

import type { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import config from "../config.js"
import db from "../db/database.js"

// ================================
// TYPER
// ================================

// Payload som finns inuti JWT-token (samma som vi skapade i login)
// OBS: använder "id" (inte "userId") för att matcha user-objektet från login
interface JwtPayload {
	id: string
	email: string
	role: string
}

// Utöka Express Request med vår user-property
// Detta gör att TypeScript förstår req.user
export interface AuthRequest extends Request {
	user?: JwtPayload
}

// ================================
// MIDDLEWARE-FUNKTIONEN
// ================================

export const authenticateToken = (
	req: AuthRequest,
	res: Response,
	next: NextFunction
): void => {
	// STEG 1: Hämta Authorization header
	// Format: "Bearer eyJhbGciOiJIUzI1NiIs..."
	const authHeader = req.headers.authorization

	// STEG 2: Extrahera token (ta bort "Bearer " prefixet)
	// Använder regex istället för split() för att hantera edge cases
	// (t.ex. dubbla mellanslag, olika casing på "Bearer")
	const token =
		authHeader && /^Bearer\s+/i.test(authHeader)
			? authHeader.replace(/^Bearer\s+/i, "").trim()
			: undefined

	// STEG 3: Kolla om token finns
	if (!token) {
		res.status(401).json({ message: "Ingen token tillhandahållen." })
		return
	}
	// STEG 3.5 Kolla om token är blacklistad (utloggad)
	const blacklisted = db
		.prepare("SELECT id FROM token_blacklist WHERE token = ?")
		.get(token)

	if (blacklisted) {
		res.status(401).json({ message: "Token har invaliderats." })
		return
	}

	// STEG 4: Verifiera token
	try {
		// jwt.verify kastar error om token är ogiltig eller utgången
		const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload

		// STEG 5: Lägg till user-info på request-objektet
		// Nu kan alla routes efter denna middleware komma åt req.user
		req.user = decoded

		// STEG 6: Fortsätt till nästa middleware/route
		next()
	} catch (_error) {
		// Token ogiltig eller utgången
		res.status(401).json({ message: "Ogiltig eller utgången token." })
		return
	}
}
