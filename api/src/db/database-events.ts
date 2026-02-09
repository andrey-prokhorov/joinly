// Events database - använder den delade anslutningen

import type { Database as DatabaseType } from "better-sqlite3"
import { v4 as uuidv4 } from "uuid"

// Funktion för att skapa events-tabell
export function createEventsTable(db: DatabaseType): void {
	db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
	  title TEXT NOT NULL, 
      description TEXT NOT NULL,                   
      category TEXT NOT NULL,
      start_time DATETIME NOT NULL,                 
      end_time DATETIME NOT NULL,
      city TEXT NOT NULL,
      city_district TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      CHECK (start_time < end_time)
    )
  `)
	console.log("Events table created/verified")
}

// Funktion för att seed:a eventdata
export function seedEvents(db: DatabaseType): void {
	const eventCount = db
		.prepare("SELECT COUNT(*) as count FROM events")
		.get() as {
		count: number
	}

	if (eventCount.count > 0) {
		console.log("Events table already has data, skipping seed")
		return
	}

	const id = uuidv4()

	db.prepare(`
    INSERT INTO events (id, title, category, start_time, end_time, city, city_district, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
		id,
		"Högdalen Running Club Event",
		"Running",
		"2024-06-01T09:00:00",
		"2024-06-01T17:00:00",
		"Stockholm",
		"Högdalen",
		"Join us for a day of running and fun in Högdalen! Whether you're a seasoned runner or just looking to get active, this event is for everyone. We'll have various running routes, from beginner-friendly to more challenging ones. Don't forget to bring your running shoes and a water bottle!"
	)

	console.log("Seed: Testevent skapad (Högdalen Running Club Event)")
}
