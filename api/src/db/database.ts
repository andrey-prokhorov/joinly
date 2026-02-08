// Gemensam databasanslutning för hela applikationen

import { mkdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import Database, { type Database as DatabaseType } from "better-sqlite3"
import {
	cleanExpiredTokens,
	createBlacklistTable,
} from "./database-blacklist.js"

// ES modules: skapa __dirname manuellt
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// databasfilen:
const dbPath = path.join(__dirname, "../../data/joinly.db")

// Skapa data-mappen om den inte finns (behövs i CI och vid första körning)
const dataDir = path.dirname(dbPath)
mkdirSync(dataDir, { recursive: true })

// Skapa en enda delad databasanslutning
const db: DatabaseType = new Database(dbPath)

// aktivera foreign key-stöd
db.pragma("foreign_keys = ON")

// Importera table creation functions
import { createEventsTable, seedEvents } from "./database-events.js"
import { createUsersTable, seedUsers } from "./database-users.js"

// Funktion för att initiera alla tabeller
export function initDatabase(): void {
	// Skapa users-tabell
	createUsersTable(db)
	// Skapa token blacklist-tabell
	createBlacklistTable(db)

	// Skapa events-tabell
	createEventsTable(db)

	// Rensa utgångna tokens från blacklist (körs alltid, även i production)
	cleanExpiredTokens(db)

	console.log("Database tables initialized")
}

// Funktion för att köra all seed-data
export function seedData(): void {
	const isProduction = process.env.NODE_ENV === "production"

	if (isProduction) {
		console.log("Produktion: Ingen seed-data skapas. Lägg till data manuellt.")
		return
	}
	seedUsers(db)
	seedEvents(db)
}

// Re-exportera seed functions för extern användning
export { seedUsers, seedEvents }

// Logga att databasen är redo
console.log("Shared database connection initialized:", dbPath)

// Exportera den delade anslutningen
export default db
