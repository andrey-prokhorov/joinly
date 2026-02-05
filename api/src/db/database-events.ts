// hantera databasen

import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Database, { type Database as DatabaseType } from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";

// ES modules: skapa __dirname manuellt
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// databasfilen:
const dbPath = path.join(__dirname, "../../data/joinly.db");

// Skapa data-mappen om den inte finns (behövs i CI och vid första körning)
const dataDir = path.dirname(dbPath);
mkdirSync(dataDir, { recursive: true });

// skapa en databasanslutning
const db: DatabaseType = new Database(dbPath);

// aktivera foreign key-stöd
db.pragma("foreign_keys = ON");

// Skapa events-tabell
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
`);

// SEED DATA (endast i development/test, ALDRIG i produktion)
// ---------------------------------------------------------
const isProduction = process.env.NODE_ENV === "production";

const eventCount = db.prepare("SELECT COUNT(*) as count FROM events").get() as {
	count: number;
};

if (eventCount.count === 0 && !isProduction) {
	// Lägg till testdata

	const id = uuidv4();

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
		"Högdalen",
	);

	console.log("Seed: Testevent skapad (Högdalen Running Club Event)");
} else if (eventCount.count === 0 && isProduction) {
	console.log(
		"Produktion: Ingen seed-data skapas för events. Lägg till events manuellt.",
	);
}

// Logga att databasen är redo
console.log("Database för EVENTS initialized:", dbPath);

export default db;
