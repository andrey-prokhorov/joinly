// Token blacklist - för att kunna invalidera JWT-tokens vid logout
// Utan blacklist lever en JWT tills den går ut (24h),
// även om användaren loggat ut eller kontot raderats.

import type { Database as DatabaseType } from "better-sqlite3"

export function createBlacklistTable(db: DatabaseType): void {
	db.exec(`
    CREATE TABLE IF NOT EXISTS token_blacklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
	console.log("Token blacklist table created/verified")
}

// Rensa bort tokens som redan gått ut (sparar diskutrymme)
// Hanterar både integer (unix epoch) och text (ISO/datetime) för bakåtkompatibilitet
// efter schema-ändring från DATETIME till INTEGER
export function cleanExpiredTokens(db: DatabaseType): void {
	const result = db
		.prepare(
			`DELETE FROM token_blacklist WHERE (
			(typeof(expires_at) = 'integer' AND expires_at < unixepoch('now'))
			OR (typeof(expires_at) = 'text' AND expires_at < datetime('now')))`
		)
		.run()
	if (result.changes > 0) {
		console.log(`Cleaned ${result.changes} expired tokens from blacklist`)
	}
}
