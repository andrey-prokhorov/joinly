// Event registrations - koppling mellan användare och events
// En rad = en användare som är anmäld till ett event
// Ingen rad = inte anmäld (vi tar bort raden vid avanmälan)

import type { Database as DatabaseType } from "better-sqlite3"

//Skapa tabellen om den inte finns
export function createRegistrationsTable(db: DatabaseType): void {
	db.exec(`
    CREATE TABLE IF NOT EXISTS event_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(event_id, user_id)
    )
  `)
	console.log("Event registrations table created/verified")
}

// Seed-data för utveckling
export function seedRegistrations(db: DatabaseType): void {
	const regCount = db
		.prepare("SELECT COUNT(*) as count FROM event_registrations")
		.get() as { count: number }

	if (regCount.count > 0) {
		console.log("Event registrations table already has data, skipping seed")
		return
	}

	// Hämta seed-användaren och första eventet dynamiskt
	// (istället för hårdkodade ID:n som kan ändras)
	const user = db
		.prepare("SELECT id FROM users WHERE email = ?")
		.get("test@example.com") as { id: string } | undefined

	const user2 = db
		.prepare("SELECT id FROM users WHERE email = ?")
		.get("user2@example.com") as { id: string } | undefined

	const event = db.prepare("SELECT id FROM events ORDER BY id LIMIT 1").get() as
		| { id: string }
		| undefined

	if (user && user2 && event) {
		const sql = db.prepare(
			"INSERT INTO event_registrations (event_id, user_id) VALUES (?, ?)"
		)
		sql.run(event.id, user.id)
		console.log("Seed: Testregistrering skapad (test-user -> first event)")
		sql.run(event.id, user2.id)
		console.log("Seed: Testregistrering skapad (test2-user -> first event)")
	}
}
