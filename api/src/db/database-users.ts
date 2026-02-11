// Users database - använder den delade anslutningen

import bcrypt from "bcryptjs"
import type { Database as DatabaseType } from "better-sqlite3"
import { v4 as uuidv4 } from "uuid"

// Funktion för att skapa users-tabell
export function createUsersTable(db: DatabaseType): void {
	db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
	console.log("Users table created/verified")
}

// Funktion för att seed:a användardata
export function seedUsers(db: DatabaseType): void {
	const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as {
		count: number
	}

	if (userCount.count > 0) {
		console.log("Users table already has data, skipping seed")
		return
	}

	// Hasha lösenordet (synkront för enkel setup)
	// Salt rounds 12 = OWASP rekommendation (starkare än default 10)
	const testPassword = "Test123!" // Uppfyller: 8+ tecken, stor, liten, siffra, special
	const hashedPassword = bcrypt.hashSync(testPassword, 12)
	const userId = uuidv4()

	// Lägg till testanvändare
	db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, "test@example.com", hashedPassword, "Test User", "user")

	console.log("Seed: Testanvändare skapad (test@example.com / Test123!)")
}
