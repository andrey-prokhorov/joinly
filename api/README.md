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
- **`SEED_TESTUSER_1_PASSWORD`** - lösenord för testanvändare 1
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

`dev:reset` droppar alla tabeller och återskapar dem med seed-data. Använd detta första gången, efter schema-ändringar, eller om databasen hamnat i trasigt tillstånd.

---

## Tillgängliga endpoints

### Autentisering
| Metod | Endpoint | Auth | Beskrivning |
|-------|----------|------|-------------|
| POST | `/api/auth/register` | Nej | Skapa konto, returnerar JWT |
| POST | `/api/auth/login` | Nej | Logga in, returnerar JWT |
| POST | `/api/auth/logout` | Ja | Logga ut, invaliderar token |
| GET | `/api/auth/me` | Ja | Hämta inloggad användare |

### Events
| Metod | Endpoint | Auth | Beskrivning |
|-------|----------|------|-------------|
| GET | `/api/events` | Ja | Hämta alla events |
| GET | `/api/events/:id` | Ja | Hämta specifikt event |
| GET | `/api/events/filter/search` | Ja | Filtrera events (city, category, datum) |
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
| GET | `/api/health` | Nej | Hälsokontroll (CI/CD) |

Se [docs/api-guide.md](docs/api-guide.md) för detaljerade request/response-exempel.

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
├── docs/                       # Detaljerad dokumentation
├── package.json
├── tsconfig.json
├── biome.json
└── .env.example                # Mall för miljövariabler
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
| `RATE_LIMIT_ENABLED` | Nej | `true` (kod) / `false` (.env.example) | Stäng av rate limiting med `false` (för test/CI) |

> `.env` är gitignored och ska aldrig pushas!

---

## CI/CD

API:et har tre jobb i GitHub Actions (`.github/workflows/ci.yml`):

| Jobb | Syfte |
|------|-------|
| `api-audit` | Säkerhetskontroll av dependencies (`npm audit`) |
| `api-lint-build` | Kodkvalitet (Biome lint + TypeScript build) |
| `api-integration-tests` | API-tester med Newman |

## Testning

```bash
# 1. Se till att RATE_LIMIT_ENABLED=false i .env (default i .env.example)
# 2. Starta servern med ren databas (i en terminal)
npm run dev:reset

# 3. Kör tester (i en annan terminal)
npm run test:api
```

> Newman (devDependency) har kända sårbarheter i sina dependencies. Dessa påverkar inte produktionskoden. CI kör `npm audit --omit=dev`.

## Deploy

```bash
NODE_ENV=production npm run build && node dist/index.js
```

Första körningen: `node dist/index.js --reset-db` för att skapa tabeller och seed-data.

Se [docs/security.md](docs/security.md) för produktionskrav och säkerhetskontroller.

---

## Dokumentation

| Dokument | Innehåll |
|----------|----------|
| [docs/api-guide.md](docs/api-guide.md) | Frontend-guide, JWT-flöde, detaljerade endpoint-exempel |
| [docs/database.md](docs/database.md) | Databasschema, tabeller, relationer, seed-data |
| [docs/security.md](docs/security.md) | ACL, rate limiting, token blacklist, produktionskrav |

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
