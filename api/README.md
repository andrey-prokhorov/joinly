# Joinly API

Backend API för Joinly-appen.

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

## Kom igång

```bash
# 1. Gå till api-mappen
cd api

# 2. Installera dependencies
npm install

# 3. Starta utvecklingsserver
npm run dev
```

Servern startar på **http://localhost:3001**

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
| GET | `/api/events/filter/search` | Ja | Hämta events med filter (city, category, date_from, date_to) |

### System
| Metod | Endpoint | Auth | Beskrivning |
|-------|----------|------|-------------|
| GET | `/api/health` | Nej | Hälsokontroll (för CI/CD) |

## npm scripts

| Kommando | Beskrivning |
|----------|-------------|
| `npm run dev` | Starta med hot reload |
| `npm run build` | Kompilera TypeScript |
| `npm run start` | Kör produktionsbygge |
| `npm run lint` | Kontrollera kod med Biome |
| `npm run format` | Formatera kod |
| `npm test` | Kör unit-tester (Vitest) |
| `npm run test:api` | Kör API-tester (Newman) |

## Projektstruktur

```
api/
├── src/
│   ├── index.ts          # Express server & routes
│   ├── config.ts         # Konfiguration
│   ├── db/
│   │   ├── database.ts          # SQLite setup, schema & seed
│   │   ├── database-events.ts   # Events seed-data
│   │   └── database-blacklist.ts # Token blacklist (logout)
│   ├── middleware/
│   │   └── auth.ts       # JWT-verifiering + blacklist-check
│   ├── routes/
│   │   ├── auth.ts       # Register, login, logout & me
│   │   └── events.ts     # Events endpoints
│   └── utils/
│       └── validators.ts # Input-validering
├── tests/
│   └── auth.postman_collection.json  # Newman API-tester
├── package.json
├── tsconfig.json         # TypeScript config
├── biome.json            # Linter config
└── .env.example          # Mall för miljövariabler
```

## Miljövariabler

Kopiera `.env.example` till `.env` för lokala inställningar:

```bash
cp .env.example .env
```

**OBS:** `.env` är gitignored och ska ALDRIG pushas!

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
# 1. Starta servern (i en terminal)
npm run dev

# 2. Kör tester (i en annan terminal)
npm run test:api
```

### Om Newman och npm audit

Newman (Postman's CLI-testverktyg) har kända sårbarheter i sina dependencies (`postman-runtime`, `lodash`, `node-forge`). Dessa påverkar **inte produktionskoden** eftersom Newman är en devDependency som bara körs vid testning.

Därför kör CI:n `npm audit --omit=dev` som bara auditerar produktions-dependencies. Din faktiska API-kod har 0 kända sårbarheter.

**Mer info:** https://github.com/postmanlabs/newman/issues (sök på "audit")

## Planerade features

- [x] Databas (SQLite)
- [x] Autentisering (JWT + bcrypt)
- [x] Events API-endpoints (CRUD + filtering)
- [x] Användarregistrering med validering
- [x] Logout med token blacklist
- [ ] ACL (behörighetskontroll)
- [ ] Event-skapande för inloggade användare

## Säkerhet

### Token Blacklist (Logout)

JWT-tokens är stateless - servern kan normalt inte invalidera dem innan de går ut. För att möjliggöra riktig utloggning använder vi en **token blacklist**:

1. Vid logout sparas token i `token_blacklist`-tabellen med utgångstid
2. Auth-middleware kontrollerar blacklist **innan** JWT verifieras
3. Utgångna tokens rensas automatiskt vid serverstart

Detta ger säkrare sessionshantering, speciellt viktigt om en token komprometteras.

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
