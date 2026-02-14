// ACL-middleware - rollbaserad åtkomstkontroll via databasregler
//
// Flöde vid varje request:
// 1. Hämta alla ACL-regler från databasen
// 2. Hitta regler som matchar HTTP-metod + route-mönster
// 3. Kolla om användarens roll matchar regeln
// 4. Om regeln har fieldMatchingUserId → verifiera ägarskap
// 5. Ingen matchande regel = 403 (secure by default)

import type { NextFunction, Response } from "express"
import config from "../config.js"
import db from "../db/database.js"
import type { AuthRequest } from "./auth.js"

// ================================
// TYPER
// ================================

// En ACL-regel från databasen
interface AclRule {
	id: number
	userRoles: string
	method: string
	restApiRoute: string
	fieldMatchingUserId: string | null
	comment: string | null
}

// ================================
// HJÄLPFUNKTIONER
// ================================

// Konverterar route-mönster till regex för matchning
// "/api/events/:id" → /^\/api\/events\/[^/]+$/
// "/api/admin/*" → /^\/api\/admin\/.*$/
function routeToRegex(routePattern: string): RegExp {
	const regex = routePattern
		.replace(/:[^/]+/g, "[^/]+") // :id, :eventId → matchar ett segment
		.replace(/\*/g, ".*") // * → matchar allt
	return new RegExp(`^${regex}$`)
}

// Kollar om användarens roll matchar regelns roller
// "*" = alla (även ej inloggade)
// "user,admin" = kommaseparerad lista
function roleMatches(
	userRole: string | undefined,
	allowedRoles: string
): boolean {
	if (allowedRoles === "*") return true
	if (!userRole) return false
	const roles = allowedRoles.split(",").map((r) => r.trim())
	return roles.includes(userRole)
}

// Extraherar resurs-ID från URL baserat på route-mönster
// path: "/api/events/abc-123", pattern: "/api/events/:id" → "abc-123"
function extractResourceId(path: string, routePattern: string): string | null {
	const pathParts = path.split("/")
	const patternParts = routePattern.split("/")

	for (let i = 0; i < patternParts.length; i++) {
		if (patternParts[i].startsWith(":")) {
			return pathParts[i] || null
		}
	}
	return null
}

// Avgör vilken databastabell som ska kollas för ägarskap
// Härleds från route-mönstret: "/api/events/:id" → "events"
function getTableFromRoute(routePattern: string): string | null {
	const parts = routePattern.split("/")
	// Mönster: /api/<tabell>/:id → tabell är index 2
	if (parts.length >= 3) {
		return parts[2]
	}
	return null
}

// Whitelist av tillåtna tabeller och fält för ägarskapskontroll
// Förhindrar SQL injection om ACL-tabellens data manipuleras
const ALLOWED_TABLES = ["events", "event_registrations", "users"]
const ALLOWED_FIELDS = ["creator_user_id", "user_id"]

// Verifierar att användaren äger resursen
// Kollar om fältet (t.ex. creator_user_id) matchar användarens ID
function verifyOwnership(
	table: string,
	resourceId: string,
	field: string,
	userId: string
): { exists: boolean; isOwner: boolean } {
	if (!ALLOWED_TABLES.includes(table) || !ALLOWED_FIELDS.includes(field)) {
		return { exists: false, isOwner: false }
	}

	try {
		const resource = db
			.prepare(`SELECT "${field}" FROM "${table}" WHERE id = ?`)
			.get(resourceId) as Record<string, unknown> | undefined

		if (!resource) return { exists: false, isOwner: false }

		return {
			exists: true,
			isOwner: resource[field] === userId,
		}
	} catch {
		return { exists: false, isOwner: false }
	}
}

// ================================
// MIDDLEWARE
// ================================

export function createAclMiddleware() {
	return (req: AuthRequest, res: Response, next: NextFunction): void => {
		// Om ACL är avstängt via config → släpp igenom allt
		if (!config.acl.enabled) {
			next()
			return
		}

		const method = req.method.toUpperCase()
		// req.path strippar mount-prefix ("/api"), så vi bygger ihop hela sökvägen
		const path = req.baseUrl + req.path
		const userRole = req.user?.role
		const userId = req.user?.id

		// Hämta alla ACL-regler från databasen
		const rules = db.prepare("SELECT * FROM acl").all() as AclRule[]

		// Gå igenom reglerna och leta efter en match
		for (const rule of rules) {
			// Steg 1: Matchar HTTP-metoden?
			if (rule.method !== "*" && rule.method !== method) continue

			// Steg 2: Matchar route-mönstret?
			const regex = routeToRegex(rule.restApiRoute)
			if (!regex.test(path)) continue

			// Steg 3: Matchar användarens roll?
			if (!roleMatches(userRole, rule.userRoles)) continue

			// Steg 4: Ägarskapskontroll (om regeln kräver det)
			if (rule.fieldMatchingUserId && userId) {
				const table = getTableFromRoute(rule.restApiRoute)
				const resourceId = extractResourceId(path, rule.restApiRoute)

				if (!table || !resourceId) continue

				const ownership = verifyOwnership(
					table,
					resourceId,
					rule.fieldMatchingUserId,
					userId
				)

				if (!ownership.exists) {
					res.status(404).json({ message: "Resursen hittades inte." })
					return
				}

				if (!ownership.isOwner) {
					// Inte ägare - prova nästa regel (t.ex. admin-regel utan ägarskapskontroll)
					continue
				}
			}

			// Alla kontroller passerade → ge access
			next()
			return
		}

		// Ingen regel matchade → neka access (secure by default)
		if (!req.user) {
			res.status(401).json({ message: "Autentisering krävs." })
		} else {
			res.status(403).json({ message: "Åtkomst nekad." })
		}
	}
}
