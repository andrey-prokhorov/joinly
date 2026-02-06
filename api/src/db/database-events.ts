// Events database - använder den delade anslutningen

import type { Database as DatabaseType } from "better-sqlite3"
import { v4 as uuidv4 } from "uuid"

// Funktion för att skapa events-tabell
export function createEventsTable(db: DatabaseType): void {
	db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,                
      description TEXT,                   
      category TEXT,
      starts_at DATETIME,                 
      ends_at DATETIME,
      city TEXT,
      city_district TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    INSERT INTO events (id, description, category, starts_at, ends_at, city, city_district)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
		id,
		"Högdalen Running Club Event",
		"Running",
		"2024-06-01T09:00:00",
		"2024-06-01T17:00:00",
		"Stockholm",
		"Högdalen"
	)

	console.log("Seed: Testevent skapad (Högdalen Running Club Event)")
}
