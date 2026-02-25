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

	const registrations = db
		.prepare("SELECT event_id, user_id FROM event_registrations")
		.all() as Array<{
		event_id: string
		user_id: string
	}>

	const insert = db.prepare(`
    INSERT INTO chat_messages (id, event_id, user_id, message, created_at)
    VALUES (?, ?, ?, ?, ?)
  `)

	registrations.forEach((reg) => {
		const testMessage = "Vad roligt detta ska bli! Kan inte vänta tills dess."
		insert.run(
			uuidv4(),
			reg.event_id,
			reg.user_id,
			testMessage,
			new Date().toISOString()
		)
	})

	console.log(`Seed: chat-meddelanden skapade för första eventet`)
}
