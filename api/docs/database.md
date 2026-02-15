# Databasarkitektur

Joinly använder **SQLite** (better-sqlite3) som databas. Filen lagras i `data/joinly.db`.

Schemat definieras i separata TypeScript-moduler under `src/db/` med en gemensam databasanslutning i `database.ts`.

---

## Tabeller

### users

Användarkonton med autentisering och roller.

| Fält | Typ | Begränsning | Beskrivning |
|------|-----|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | UUID (genereras med `uuidv4()`) |
| `email` | TEXT | UNIQUE NOT NULL | E-postadress för inloggning |
| `password_hash` | TEXT | NOT NULL | bcrypt-hash (12 salt rounds) |
| `name` | TEXT | | Visningsnamn |
| `role` | TEXT | DEFAULT 'user' | `user` eller `admin` |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Skapandedatum |

**Källfil:** `src/db/database-users.ts`

### events

Event-listor skapade av användare.

| Fält | Typ | Begränsning | Beskrivning |
|------|-----|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | UUID |
| `title` | TEXT | NOT NULL | Eventets namn |
| `description` | TEXT | NOT NULL | Beskrivning |
| `category` | TEXT | NOT NULL | Kategori (t.ex. "Running", "music") |
| `start_time` | DATETIME | NOT NULL | Starttid |
| `end_time` | DATETIME | NOT NULL | Sluttid |
| `city` | TEXT | NOT NULL | Stad |
| `city_district` | TEXT | | Stadsdel (valfritt) |
| `creator_user_id` | TEXT | NOT NULL | Skaparens user-ID |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Skapandedatum |

**Constraints:**
- `CHECK (julianday(start_time) < julianday(end_time))` - sluttid måste vara efter starttid

**Källfil:** `src/db/database-events.ts`

### event_registrations

Koppling mellan användare och events. En rad = en användare anmäld till ett event.

| Fält | Typ | Begränsning | Beskrivning |
|------|-----|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Auto-ID |
| `event_id` | TEXT | NOT NULL, FK → events(id) | Eventet |
| `user_id` | TEXT | NOT NULL, FK → users(id) | Användaren |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Anmälningsdatum |

**Constraints:**
- `FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE`
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
- `UNIQUE(event_id, user_id)` - en användare kan bara anmäla sig en gång per event

**Källfil:** `src/db/database-registrations.ts`

### token_blacklist

Invaliderade JWT-tokens. Gör det möjligt att logga ut ordentligt.

| Fält | Typ | Begränsning | Beskrivning |
|------|-----|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Auto-ID |
| `token` | TEXT | UNIQUE NOT NULL | JWT-tokensträngen |
| `expires_at` | INTEGER | NOT NULL | Unix epoch när token går ut |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | När token blacklistades |

Utgångna tokens rensas automatiskt vid serverstart via `cleanExpiredTokens()`.

**Källfil:** `src/db/database-blacklist.ts`

### acl

Regler för rollbaserad åtkomstkontroll (Access Control List). 21 seed-regler.

| Fält | Typ | Begränsning | Beskrivning |
|------|-----|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Regel-ID |
| `userRoles` | TEXT | NOT NULL | Kommaseparerade roller (t.ex. `user,admin` eller `*`) |
| `method` | TEXT | NOT NULL | HTTP-metod (GET, POST, PUT, DELETE) |
| `restApiRoute` | TEXT | NOT NULL | API-route (t.ex. `/api/events/:id`) |
| `fieldMatchingUserId` | TEXT | | Fältnamn för ägarskapskontroll (t.ex. `creator_user_id`) |
| `comment` | TEXT | | Beskrivning av regeln |

Se [security.md](security.md) för detaljer om hur ACL fungerar.

**Källfil:** `src/db/database-acl.ts`

---

## Relationer

```
users
  │
  ├──< events              (creator_user_id → users.id)
  │      │
  │      └──< event_registrations  (event_id → events.id, CASCADE)
  │
  └──< event_registrations        (user_id → users.id, CASCADE)


token_blacklist              (fristående, ingen FK)
acl                          (konfigurationstabell, ingen FK)
```

**Cascade-beteende:**
- Tar man bort en user → alla dennes event_registrations tas bort automatiskt
- Tar man bort ett event → alla registreringar till det eventet tas bort automatiskt

**ID-strategi:**
- `users` och `events` använder UUID (TEXT) - svårare att gissa, bättre för distribuerade system
- Stödtabeller (`event_registrations`, `token_blacklist`, `acl`) använder INTEGER AUTOINCREMENT - effektivare indexering

---

## Seed-data (development)

Seed-data skapas bara i development (`NODE_ENV !== 'production'`). Om tabellen redan har data hoppas seed över.

### Användare

| Email | Roll | Lösenord |
|-------|------|----------|
| test@example.com | user | Från `SEED_TESTUSER_1_PASSWORD` i .env |
| user2@example.com | user | Från `SEED_TESTUSER_2_PASSWORD` i .env |
| admin@example.com | admin | Från `SEED_ADMIN_1_PASSWORD` i .env |

### Events

- "Högdalen Running Club Event" i Stockholm/Högdalen (skapas med `creator_user_id: "seed-user-id"`)

### Registreringar

- test@example.com registreras automatiskt till första eventet (ID:n hämtas dynamiskt)

### ACL-regler

21 regler som täcker alla endpoints. Se [security.md](security.md) för komplett lista.

---

## Databasinitiering

Initieringen sker i `database.ts` via `initDatabase()`:

1. Skapa alla tabeller (IF NOT EXISTS)
2. Rensa utgångna tokens från blacklist
3. Om development: kör seed-data

**Återställning:** `npm run dev:reset` eller `node dist/index.js --reset-db` tar bort hela databasfilen och skapar om allt från scratch.

**Foreign keys:** Aktiverade via `PRAGMA foreign_keys = ON` (måste sättas varje gång databasen öppnas i SQLite).
