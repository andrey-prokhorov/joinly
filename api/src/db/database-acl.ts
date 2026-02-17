// ACL database - regler för rollbaserad åtkomstkontroll

import type { Database as DatabaseType } from "better-sqlite3"

// Skapa ACL-tabell
export function createAclTable(db: DatabaseType): void {
	db.exec(`
    CREATE TABLE IF NOT EXISTS acl (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userRoles TEXT NOT NULL,
      method TEXT NOT NULL,
      restApiRoute TEXT NOT NULL,
      fieldMatchingUserId TEXT,
      comment TEXT
    )
  `)
	console.log("ACL table created/verified")
}

// Seeda ACL-regler (bara i development)
export function seedAclRules(db: DatabaseType): void {
	const ruleCount = db.prepare("SELECT COUNT(*) as count FROM acl").get() as {
		count: number
	}

	if (ruleCount.count > 0) {
		console.log("ACL table already has data, skipping seed")
		return
	}

	const insert = db.prepare(`
    INSERT INTO acl (userRoles, method, restApiRoute, fieldMatchingUserId, comment)
    VALUES (?, ?, ?, ?, ?)
  `)

	// Auth - publika
	insert.run("*", "POST", "/api/auth/register", null, "Alla kan registrera sig")
	insert.run("*", "POST", "/api/auth/login", null, "Alla kan logga in")

	// Auth - kräver inloggning
	insert.run(
		"user,admin",
		"GET",
		"/api/auth/me",
		null,
		"Inloggade: hämta profil"
	)
	insert.run(
		"user,admin",
		"POST",
		"/api/auth/logout",
		null,
		"Inloggade: logga ut"
	)

	// Events - kräver inloggning (fysisk säkerhet: bara registrerade användare ser events)
	insert.run(
		"user,admin",
		"GET",
		"/api/events",
		null,
		"Inloggade: lista events"
	)
	insert.run(
		"user,admin",
		"GET",
		"/api/events/:id",
		null,
		"Inloggade: se ett event"
	)
	insert.run(
		"user,admin",
		"GET",
		"/api/events/filter/search",
		null,
		"Inloggade: filtrera events"
	)

	// Events - kräver inloggning
	insert.run(
		"user,admin",
		"POST",
		"/api/events",
		null,
		"Inloggade: skapa event"
	)

	// Events - ägarskapskontroll (user redigerar/tar bort sina egna)
	insert.run(
		"user",
		"PUT",
		"/api/events/:id",
		"creator_user_id",
		"User: redigera egna events"
	)
	insert.run(
		"user",
		"DELETE",
		"/api/events/:id",
		"creator_user_id",
		"User: ta bort egna events"
	)

	// Events - admin kan redigera/ta bort alla (ingen ägarskapskontroll)
	insert.run(
		"admin",
		"PUT",
		"/api/events/:id",
		null,
		"Admin: redigera alla events"
	)
	insert.run(
		"admin",
		"DELETE",
		"/api/events/:id",
		null,
		"Admin: ta bort alla events"
	)

	// Event registrations
	insert.run(
		"user,admin",
		"POST",
		"/api/events/:eventId/register",
		null,
		"Inloggade: anmäl till event"
	)
	insert.run(
		"user,admin",
		"DELETE",
		"/api/events/:eventId/register",
		null,
		"Inloggade: avanmäl från event"
	)
	insert.run(
		"user,admin",
		"GET",
		"/api/events/:eventId/registrations",
		null,
		"Inloggade: se deltagarlista"
	)

	// Event chat
	insert.run(
		"user,admin",
		"GET",
		"/api/events/:id/chat",
		null,
		"Inloggade: hämta chatmeddelanden"
	)
	insert.run(
		"user,admin",
		"POST",
		"/api/events/:id/chat",
		null,
		"Inloggade: skicka chattmeddelande"
	)

	// Health
	insert.run("*", "GET", "/api/health", null, "Hälsokontroll")

	// ACL admin-endpoints
	insert.run("admin", "GET", "/api/acl", null, "Admin: se ACL-regler")
	insert.run("admin", "POST", "/api/acl", null, "Admin: skapa regel")
	insert.run("admin", "PUT", "/api/acl/:id", null, "Admin: uppdatera regel")
	insert.run("admin", "DELETE", "/api/acl/:id", null, "Admin: ta bort regel")

	console.log("Seed: 21 ACL-regler skapade")
}
