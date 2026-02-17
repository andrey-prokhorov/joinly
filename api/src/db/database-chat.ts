// Chat database - uses shared connection

import type { Database as DatabaseType } from "better-sqlite3"
import { v4 as uuidv4 } from "uuid"

// Funktion för att skapa chat_messages-tabell
export function createChatTable(db: DatabaseType): void {
	db.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)
	console.log("Chat messages table created/verified")
}

// Funktion för att seed:a chat-data
export function seedChatMessages(db: DatabaseType): void {
	const messageCount = db
		.prepare("SELECT COUNT(*) as count FROM chat_messages")
		.get() as {
		count: number
	}

	if (messageCount.count > 0) {
		console.log("Chat messages table already has data, skipping seed")
		return
	}

	// Hämta alla events och users
	const events = db.prepare("SELECT id FROM events").all() as Array<{
		id: string
	}>
	const users = db.prepare("SELECT id FROM users").all() as Array<{ id: string }>

	if (events.length === 0 || users.length === 0) {
		console.warn(
			"Seed: Inga events eller users funna. Seed events och users först före chat messages."
		)
		return
	}

	const insert = db.prepare(`
    INSERT INTO chat_messages (id, event_id, user_id, message, created_at)
    VALUES (?, ?, ?, ?, ?)
  `)

	// Skapa chat-meddelanden för det första eventet
	const firstEvent = events[0]
	const testMessages = [
		"Vad roligt detta ska bli! Kan inte vänta tills dess.",
		"Finns det möjlighet att köpa biljetter på plats?",
		"Jag tänker komma tillsammans med några vänner.",
		"Ser fram emot detta event!",
		"Vilka är startpunkterna för löpsträckorna?",
	]

	testMessages.forEach((message, index) => {
		insert.run(
			uuidv4(),
			firstEvent.id,
			users[index % users.length].id,
			message,
			new Date(Date.now() - (testMessages.length - index) * 60000).toISOString()
		)
	})

	console.log(
		`Seed: ${testMessages.length} chat-meddelanden skapade för första eventet`
	)
}
