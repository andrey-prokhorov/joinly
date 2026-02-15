# Joinly API

Backend API for the Joinly app - event management with authentication and role-based access control.

## Tech Stack

| Teknik | Version | Syfte |
|--------|---------|-------|
| Node.js | 22+ | Runtime |
| TypeScript | 5.7 | Typsäkerhet |
| Express | 5.x | Web framework |
| SQLite | better-sqlite3 | Databas |
| JWT | jsonwebtoken | Autentisering |
| Biome | 2.2 | Linter & formatter |
| Newman | 6.2 | API-tester |

## Snabbstart

### 1. Installera dependencies

```bash
cd api
npm install
```

### 2. Konfigurera miljövariabler

```bash
cp .env.example .env
```

Öppna `.env` och fyll i:
- **`JWT_SECRET`** - byt till en egen hemlig sträng (minst 32 tecken)
- **`SEED_TESTUSER_1_PASSWORD`** - lösenord för testanvändare 1 (se lösenordskrav nedan)
- **`SEED_TESTUSER_2_PASSWORD`** - lösenord för testanvändare 2
- **`SEED_ADMIN_1_PASSWORD`** - lösenord för admin-testanvändare

Lösenordskrav: 8+ tecken, stor bokstav, liten bokstav, siffra, specialtecken.

> **OBS:** `.env` är gitignored och ska aldrig pushas. Be teamet om seed-lösenord separat.

### 3. Starta servern

```bash
# Första gången (eller efter schema-ändringar): återställ databasen
npm run dev:reset

# Efteråt räcker vanlig start
npm run dev
```

Servern startar på **http://localhost:3001**

### Vad gör `dev:reset`?

`dev:reset` droppar alla tabeller och återskapar dem med seed-data. Använd detta:
- Första gången du kör API:et
- Efter att någon ändrat databasschema (nya tabeller/kolumner)
- Om databasen hamnat i trasigt tillstånd

Normal `dev` behåller befintlig data mellan omstarter.

---

## För dig som bygger frontend

### Autentisering (JWT)

Alla endpoints utom register, login och health kräver en JWT-token.

**Flöde:**
1. Användaren registrerar sig eller loggar in → API:et returnerar en `token`
2. Spara token (t.ex. i localStorage eller state)
3. Skicka token i alla API-anrop:
   ```
   Authorization: Bearer <token>
   ```
4. Om du får `401` → token saknas, är ogiltig, utgången eller utloggad. Redirecta till login.
5. Vid logout → anropa `POST /api/auth/logout` + ta bort token lokalt

### ACL (Access Control List)

API:et använder rollbaserad åtkomstkontroll (ACL). Varje endpoint har en regel som avgör vem som får använda den.

**Roller:**
| Roll | Beskrivning |
|------|-------------|
| `*` | Alla (även ej inloggade) - bara register, login, health |
| `user` | Vanlig inloggad användare |
| `admin` | Administratör |

**Vad detta innebär för frontend:**
- Skicka alltid `Authorization: Bearer <token>` - utan det får du `401` på de flesta endpoints
- Skapare av ett event kan uppdatera/ta bort det, admin kan uppdatera/ta bort alla
- Om en användare försöker något den inte har behörighet till → `403 Forbidden`

### Felhantering

API:et returnerar alltid JSON. Vanliga statuskoder:

| Status | Betydelse | Frontend-åtgärd |
|--------|-----------|-----------------|
| 200/201 | OK | Visa data |
| 400 | Ogiltig request (saknade fält, dåligt format) | Visa felmeddelande för användaren |
| 401 | Ej autentiserad (token saknas/ogiltig) | Redirecta till login |
| 403 | Forbidden (saknar behörighet) | Visa "ingen behörighet"-meddelande |
| 404 | Resursen finns inte | Visa "hittades inte" |
| 409 | Konflikt (t.ex. email redan registrerad) | Visa specifikt felmeddelande |
| 429 | Rate limit (för många försök) | Visa "försök igen senare" |

---

## Tillgängliga endpoints

### Autentisering
| Metod | Endpoint | Auth | Beskrivning |
|-------|----------|------|-------------|
| POST | `/api/auth/register` | Nej | Skapa konto (namn, e-post, lösenord), returnerar JWT |
| POST | `/api/auth/login` | Nej | Logga in, returnerar JWT-token |
| POST | `/api/auth/logout` | Ja | Logga ut, invaliderar token via blacklist |
| GET | `/api/auth/me` | Ja | Hämta inloggad användare |

### Events
| Metod | Endpoint | Auth | Beskrivning |
|-------|----------|------|-------------|
| GET | `/api/events` | Ja | Hämta alla events (sorterat på startdatum) |
| GET | `/api/events/:id` | Ja | Hämta specifikt event med ID |
| GET | `/api/events/filter/search` | Ja | Filtrera events (city, category, date_from, date_to) |
| POST | `/api/events` | Ja | Skapa nytt event |
| PUT | `/api/events/:id` | Ja | Uppdatera event (skapare eller admin) |
| DELETE | `/api/events/:id` | Ja | Ta bort event (skapare eller admin) |

### Event-registreringar
| Metod | Endpoint | Auth | Beskrivning |
|-------|----------|------|-------------|
| POST | `/api/events/:eventId/register` | Ja | Anmäl dig till event |
| DELETE | `/api/events/:eventId/register` | Ja | Avanmäl dig från event |

### System
| Metod | Endpoint | Auth | Beskrivning |
|-------|----------|------|-------------|
| GET | `/api/health` | Nej | Hälsokontroll (för CI/CD) |

---

## API-guide med exempel

### Registrera konto

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Anna Svensson",
  "email": "anna@example.com",
  "password": "MinSäkra123!"
}
```

**Svar (201):**
```json
{
  "message": "Användare skapad. Du kan nu logga in.",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 3,
    "email": "anna@example.com",
    "name": "Anna Svensson",
    "role": "user"
  }
}
```

**Vanliga fel:**

| Status | Orsak |
|--------|-------|
| 400 | Saknade fält, ogiltigt email-format, svagt lösenord, ogiltigt namn |
| 409 | E-postadressen är redan registrerad |
| 429 | Rate limit (max 5 försök per 15 min) |

**Lösenordskrav:** 8-128 tecken, stor bokstav, liten bokstav, siffra, specialtecken.
**Namnkrav:** 2-50 tecken, ingen HTML.

### Logga in

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "anna@example.com",
  "password": "MinSäkra123!"
}
```

**Svar (200):**
```json
{
  "message": "Inloggning lyckades.",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 3,
    "email": "anna@example.com",
    "name": "Anna Svensson",
    "role": "user"
  }
}
```

**Vanliga fel:**

| Status | Orsak |
|--------|-------|
| 400 | Saknade fält eller ogiltigt email-format |
| 401 | Fel e-post eller lösenord |
| 429 | Rate limit (10 per IP / 5 per email per 15 min) |

### Logga ut

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**Svar (200):**
```json
{
  "message": "Utloggad."
}
```

Token blir ogiltig direkt efter logout. Frontend bör ta bort token från localStorage/state.

### Hämta inloggad användare

```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Svar (200):**
```json
{
  "user": { "id": 3, "email": "anna@example.com", "role": "user" },
  "message": "Användare är inloggad."
}
```

**Fel (401):** Token saknas, är ogiltig, utgången, eller utloggad (blacklistad).

### Hämta alla events

```http
GET /api/events
Authorization: Bearer <token>
```

**Svar (200):**
```json
{
  "success": true,
  "events": [
    {
      "id": "abc-123",
      "title": "Lördagskonsert i parken",
      "description": "En fantastisk utomhuskonsert",
      "category": "music",
      "start_time": "2026-03-15T18:00:00Z",
      "end_time": "2026-03-15T21:00:00Z",
      "city": "Stockholm",
      "city_district": "Södermalm",
      "created_at": "2026-02-01T10:00:00Z"
    }
  ],
  "count": 1
}
```

### Hämta event med ID

```http
GET /api/events/:id
Authorization: Bearer <token>
```

**Svar (200):**
```json
{
  "success": true,
  "event": { "id": "abc-123", "description": "...", "..." : "..." }
}
```

**Fel:** 404 om event inte finns.

### Skapa nytt event

```http
POST /api/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Konsert i parken",
  "description": "En fantastisk utomhuskonsert",
  "category": "music",
  "start_time": "2026-06-15T18:00:00Z",
  "end_time": "2026-06-15T21:00:00Z",
  "city": "Stockholm",
  "city_district": "Södermalm"
}
```

**Svar (201):**
```json
{
  "success": true,
  "message": "Event skapat framgångsrikt.",
  "event": {
    "id": "abc-123",
    "title": "Konsert i parken",
    "description": "En fantastisk utomhuskonsert",
    "category": "music",
    "start_time": "2026-06-15T18:00:00Z",
    "end_time": "2026-06-15T21:00:00Z",
    "city": "Stockholm",
    "city_district": "Södermalm",
    "created_at": "2026-02-08T10:00:00Z"
  }
}
```

**Vanliga fel:**

| Status | Orsak |
|--------|-------|
| 400 | Saknade fält (title, description, category, start_time, end_time, city krävs) |
| 400 | Ogiltigt datumformat (använd ISO 8601) |
| 400 | Starttid efter sluttid |
| 401 | Saknar eller ogiltig token |

### Uppdatera event

```http
PUT /api/events/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Uppdaterad konsert",
  "description": "Uppdaterad beskrivning",
  "category": "culture"
}
```

Alla fält är valfria - skicka bara det du vill uppdatera.

**Svar (200):**
```json
{
  "success": true,
  "message": "Event uppdaterat framgångsrikt.",
  "event": {
    "id": "abc-123",
    "title": "Uppdaterad konsert",
    "description": "Uppdaterad beskrivning",
    "category": "culture",
    "start_time": "2026-06-15T18:00:00Z",
    "end_time": "2026-06-15T21:00:00Z",
    "city": "Stockholm",
    "city_district": "Södermalm",
    "created_at": "2026-02-08T10:00:00Z"
  }
}
```

**Vanliga fel:**

| Status | Orsak |
|--------|-------|
| 400 | Inga fält att uppdatera |
| 400 | Ogiltigt datumformat |
| 400 | Resulterande starttid efter sluttid |
| 401 | Saknar eller ogiltig token |
| 404 | Event med detta ID finns inte |

### Ta bort event

```http
DELETE /api/events/:id
Authorization: Bearer <token>
```

**Svar (200):**
```json
{
  "success": true,
  "message": "Event borttaget framgångsrikt.",
  "deletedEvent": {
    "id": "abc-123",
    "title": "Konsert i parken",
    "description": "En fantastisk utomhuskonsert",
    "category": "music",
    "start_time": "2026-06-15T18:00:00Z",
    "end_time": "2026-06-15T21:00:00Z",
    "city": "Stockholm",
    "city_district": "Södermalm",
    "created_at": "2026-02-08T10:00:00Z"
  }
}
```

**Vanliga fel:**

| Status | Orsak |
|--------|-------|
| 401 | Saknar eller ogiltig token |
| 404 | Event med detta ID finns inte |

### Filtrera events

```http
GET /api/events/filter/search?city=Stockholm&category=music&date_from=2026-03-01T00:00:00Z&date_to=2026-04-01T23:59:59Z
Authorization: Bearer <token>
```

Alla query-parametrar är valfria. Kombinera fritt.

**Svar (200):**
```json
{
  "success": true,
  "events": [],
  "count": 0,
  "filters": {
    "city": "Stockholm",
    "category": "music",
    "date_from": "2026-03-01T00:00:00Z",
    "date_to": "2026-04-01T23:59:59Z"
  }
}
```

### Anmäl dig till event

```http
POST /api/events/:eventId/register
Authorization: Bearer <token>
```

**Svar (201):**
```json
{
  "success": true,
  "message": "Anmälan lyckades.",
  "registration": {
    "event_id": "abc-123",
    "user_id": 3
  }
}
```

**Vanliga fel:**

| Status | Orsak |
|--------|-------|
| 400 | Ogiltigt event-ID (inte UUID) |
| 400 | Eventet har redan slutat |
| 401 | Saknar eller ogiltig token |
| 404 | Eventet finns inte |
| 409 | Redan anmäld till detta event |

### Avanmäl dig från event

```http
DELETE /api/events/:eventId/register
Authorization: Bearer <token>
```

**Svar (200):**
```json
{
  "success": true,
  "message": "Avanmälan lyckades."
}
```

**Vanliga fel:**

| Status | Orsak |
|--------|-------|
| 400 | Ogiltigt event-ID |
| 401 | Saknar eller ogiltig token |
| 404 | Eventet finns inte eller du är inte anmäld |

---

## npm scripts

| Kommando | Beskrivning |
|----------|-------------|
| `npm run dev` | Starta med hot reload |
| `npm run dev:reset` | Starta med hot reload + återställ databas |
| `npm run build` | Kompilera TypeScript |
| `npm run start` | Kör produktionsbygge |
| `npm run start:reset` | Kör produktionsbygge + återställ databas |
| `npm run lint` | Kontrollera kod med Biome |
| `npm run format` | Formatera kod |
| `npm test` | Kör unit-tester (Vitest) |
| `npm run test:api` | Kör API-tester (Newman) |

## Projektstruktur

```
api/
├── src/
│   ├── index.ts                # Express server & middleware
│   ├── config.ts               # Konfiguration (env-variabler)
│   ├── db/
│   │   ├── database.ts              # SQLite setup, schema & seed
│   │   ├── database-users.ts        # Users-tabell & seed-data
│   │   ├── database-events.ts       # Events-tabell & seed-data
│   │   ├── database-registrations.ts # Event-registreringar
│   │   ├── database-acl.ts          # ACL-regler (21 regler)
│   │   └── database-blacklist.ts    # Token blacklist (logout)
│   ├── middleware/
│   │   ├── auth.ts             # JWT-verifiering + blacklist-check
│   │   └── acl.ts              # Rollbaserad åtkomstkontroll
│   ├── routes/
│   │   ├── auth.ts             # Register, login, logout & me
│   │   ├── events.ts           # Events CRUD + filter
│   │   └── registrations.ts    # Anmälan/avanmälan till events
│   └── utils/
│       └── validators.ts       # Input-validering
├── tests/                      # Newman API-tester
├── package.json
├── tsconfig.json
├── biome.json
└── .env.example                # Mall for miljövariabler
```

## Miljövariabler

Kopiera `.env.example` till `.env`:

```bash
cp .env.example .env
```

| Variabel | Krävs | Default | Beskrivning |
|----------|-------|---------|-------------|
| `NODE_ENV` | Nej | `development` | `development`, `production` eller `test` |
| `PORT` | Nej | `3001` | Port som servern lyssnar på |
| `JWT_SECRET` | Ja (prod) | dev-fallback | Hemlig nyckel för JWT-signering (minst 32 tecken) |
| `JWT_EXPIRES_IN` | Nej | `24h` | Token-livslängd (t.ex. `1h`, `7d`) |
| `SEED_TESTUSER_1_PASSWORD` | Ja | - | Lösenord för seed-testanvändare 1 |
| `SEED_TESTUSER_2_PASSWORD` | Ja | - | Lösenord för seed-testanvändare 2 |
| `SEED_ADMIN_1_PASSWORD` | Ja | - | Lösenord för seed-admin |
| `ACL_ENABLED` | Nej | `true` | Stäng av ACL med `false` (för felsökning) |
| `RATE_LIMIT_ENABLED` | Nej | `true` | Stäng av rate limiting med `false` (för test/CI) |

> `.env` är gitignored och ska aldrig pushas!

---

## Deploy (produktion)

### Miljövariabler som MÅSTE sättas

```bash
NODE_ENV=production
JWT_SECRET=<en-lång-slumpmässig-sträng-minst-32-tecken>
SEED_TESTUSER_1_PASSWORD=<lösenord-som-uppfyller-kraven>
SEED_TESTUSER_2_PASSWORD=<lösenord-som-uppfyller-kraven>
SEED_ADMIN_1_PASSWORD=<lösenord-som-uppfyller-kraven>
ACL_ENABLED=true
RATE_LIMIT_ENABLED=true
```

### Starta

```bash
npm run build
node dist/index.js
```

Första körningen: använd `--reset-db` för att skapa tabeller och seed-data:

```bash
node dist/index.js --reset-db
```

### Säkerhetskontroller

- `JWT_SECRET` **måste** bytas från default - servern vägrar starta i produktion med default-värdet
- Rate limiting **ska** vara på (`true`) i produktion
- ACL **ska** vara på (`true`) i produktion
- Kör `npm audit --omit=dev` för att kontrollera produktionsberoenden

---

## CI/CD

API:et har tre jobb i GitHub Actions (`.github/workflows/ci.yml`):

| Jobb | Syfte |
|------|-------|
| `api-audit` | Säkerhetskontroll av dependencies (`npm audit`) |
| `api-lint-build` | Kodkvalitet (Biome lint + TypeScript build) |
| `api-integration-tests` | API-tester med Newman |

**Varför separata jobb?**
- Snabbare feedback - du ser direkt *vad* som failade
- Körs parallellt - sparar tid
- Oberoende - ett säkerhetsproblem blockerar inte lint-feedback

## Testning

### Köra API-tester lokalt

```bash
# 1. Se till att RATE_LIMIT_ENABLED=false i .env (default i .env.example)
# 2. Starta servern med ren databas (i en terminal)
npm run dev:reset

# 3. Kör tester (i en annan terminal)
npm run test:api
```

> Rate limiting måste vara avstängd vid testkörning, annars får du `429`-fel efter ett par test-samlingar.

### Om Newman och npm audit

Newman (Postman's CLI-testverktyg) har kända sårbarheter i sina dependencies (`postman-runtime`, `lodash`, `node-forge`). Dessa påverkar **inte produktionskoden** eftersom Newman är en devDependency som bara körs vid testning.

Därför kör CI:n `npm audit --omit=dev` som bara auditerar produktions-dependencies. Din faktiska API-kod har 0 kända sårbarheter.

## Säkerhet

### Token Blacklist (Logout)

JWT-tokens är stateless - servern kan normalt inte invalidera dem innan de går ut. För att möjliggöra riktig utloggning använder vi en **token blacklist**:

1. Vid logout sparas token i `token_blacklist`-tabellen med utgångstid
2. Auth-middleware kontrollerar blacklist **innan** JWT verifieras
3. Utgångna tokens rensas automatiskt vid databasinitiering

Detta ger säkrare sessionshantering, speciellt viktigt om en token komprometteras.

### ACL (Access Control List)

Behörigheter styrs via en `acl`-tabell i databasen med 21 regler. Varje request matchas mot dessa regler.

**Flöde vid varje request:**
1. `optionalToken` - extrahera JWT om den finns (sätter `req.user`)
2. `createAclMiddleware()` - hämta ACL-regler, matcha mot metod + route + roll
3. Om `fieldMatchingUserId` finns i regeln → verifiera att användaren äger resursen
4. Ingen matchande regel = `403 Forbidden` (secure by default)

**Regeltyper:**
- `*` = alla (register, login, health)
- `user,admin` = kräver inloggning
- `fieldMatchingUserId: "creator_user_id"` = bara skaparen (eller admin) kan ändra/ta bort

ACL kan stängas av med `ACL_ENABLED=false` i `.env` (för felsökning).

### Rate Limiting

Auth-endpoints skyddas mot brute-force:

| Endpoint | Gräns per IP | Gräns per email | Fönster |
|----------|-------------|-----------------|---------|
| `/api/auth/register` | 5 req | - | 15 min |
| `/api/auth/login` | 10 req | 5 req | 15 min |

Login har dubbel rate limiting (IP + email) för att skydda mot distribuerade attacker.

### Timing Attack Prevention

Login-endpointen kör alltid `bcrypt.compare()`, även om användaren inte finns i databasen. Detta förhindrar att en angripare kan mäta svarstiden för att avgöra om en e-postadress är registrerad.

---

## Ändringslogg

### 2026-02-15 - ACL-middleware (Pål) - Epic #62, Issue #63

- Implementerat databasdriven ACL med 21 regler i `acl`-tabellen
- ACL-middleware ersätter alla hårdkodade behörighetskontroller
- `optionalToken` ersätter `authenticateToken` - extraherar JWT utan att blockera
- Ägarskapsverifiering via `fieldMatchingUserId` (skapare eller admin)
- SQL injection-skydd med route-whitelist
- ACL toggle via `ACL_ENABLED` i `.env`
- Rate limit toggle via `RATE_LIMIT_ENABLED` i `.env` (för test/CI)
- 3 seed-användare: testuser1 (user), testuser2 (user), admin1 (admin)
- Seed-lösenord läses från miljövariabler (inte hårdkodade)
- Newman-tester uppdaterade (103 assertions)

### 2026-02-14 - Event-registrering (Pål) - PR #59

- Implementerat `POST /api/events/:eventId/register` - anmäl till event
- Implementerat `DELETE /api/events/:eventId/register` - avanmäl från event
- UUID-validering av event-ID
- Kontroll att event inte redan slutat
- Skydd mot dubbelanmälan (409 Conflict)
- Newman-tester för registreringar (24 assertions)

### 2026-02-08 - Register & Logout (Pål) - Issue #3, #4

- Implementerat `POST /api/auth/register` - skapa konto med namn, e-post, lösenord
  - Validering av namn (2-50 tecken), e-post (RFC-format), lösenord (8+ tecken, versaler, siffror, specialtecken)
  - Auto-login: returnerar JWT direkt efter registrering
  - Rate limiting: 5 försök per 15 minuter
- Implementerat `POST /api/auth/logout` - invalidera token via blacklist
  - Token sparas i `token_blacklist`-tabellen med utgångstid
  - Auth-middleware kontrollerar blacklist innan JWT-verifiering
  - Utgångna tokens rensas automatiskt vid serverstart
- Fabriksfunktion för rate limiters (DRY)
- Lagt till Newman API-tester (22 tester, 49 assertions)

### 2026-02-02 - Login med JWT (Pål) - Issue #9

- SQLite databas med users-tabell och seed-data för testanvändare
- Config-modul med JWT-inställningar (secret, expiry)
- Validators för e-post och lösenord
- Implementerat `POST /api/auth/login` - autentisering med e-post och lösenord
- Implementerat `GET /api/auth/me` - hämta inloggad användare (skyddad route)
- Skapat JWT middleware för att skydda routes
- Lagt till Newman API-tester (6 tester, 13 assertions)
- Lagt till CI-jobb: `api-integration-tests`
- Fixat: `data/`-mappen skapas automatiskt (för CI-kompatibilitet)

### 2026-01-28 - Initial setup (Pål)

- Skapat grundstruktur med TypeScript + Express 5
- Lagt till `/api/health` och `/api/hello` endpoints
- Konfigurerat Biome (samma linter som frontend)
- Request logging med färgkodning i terminalen
- Uppdaterat `.gitignore` med `.env` och `*.db`
- Lagt till CI-jobb: `api-audit` och `api-lint-build`
