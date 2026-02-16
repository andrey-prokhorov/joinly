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

	// Lösenord läses från env-variabler (aldrig hårdkodade i kod)
	const testUser1Password = process.env.SEED_TESTUSER_1_PASSWORD
	const testUser2Password = process.env.SEED_TESTUSER_2_PASSWORD
	const admin1Password = process.env.SEED_ADMIN_1_PASSWORD

	if (!testUser1Password || !testUser2Password || !admin1Password) {
		console.warn(
			"Seed: SEED_TESTUSER_1_PASSWORD, SEED_TESTUSER_2_PASSWORD och/eller SEED_ADMIN_1_PASSWORD saknas i .env, hoppar över seed"
		)
		return
	}

	// Salt rounds 12 = OWASP rekommendation (starkare än default 10)
	const insert = db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role)
    VALUES (?, ?, ?, ?, ?)
  `)

	// Testanvändare 1 (user)
	insert.run(
		uuidv4(),
		"test@example.com",
		bcrypt.hashSync(testUser1Password, 12),
		"Test User",
		"user"
	)

	// Testanvändare 2 (user) - för att testa ägarskapskontroll
	insert.run(
		uuidv4(),
		"user2@example.com",
		bcrypt.hashSync(testUser2Password, 12),
		"Test User 2",
		"user"
	)

	// Admin-användare
	insert.run(
		uuidv4(),
		"admin@example.com",
		bcrypt.hashSync(admin1Password, 12),
		"Admin User",
		"admin"
	)

	console.log("Seed: 3 testanvändare skapade (user, user2, admin)")
}
