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

| Metod | Endpoint | Auth | Beskrivning |
|-------|----------|------|-------------|
| GET | `/api/health` | Nej | Hälsokontroll (för CI/CD) |
| POST | `/api/auth/login` | Nej | Logga in, returnerar JWT-token |
| GET | `/api/auth/me` | Ja | Hämta inloggad användare |

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
│   │   └── database.ts   # SQLite setup & seed
│   ├── middleware/
│   │   └── auth.ts       # JWT-verifiering
│   ├── routes/
│   │   └── auth.ts       # Login & me endpoints
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
- [ ] ACL (behörighetskontroll)
- [ ] API-endpoints (baserat på user stories)

---

## Ändringslogg

### 2026-01-28 - Initial setup (Pål)

- Skapat grundstruktur med TypeScript + Express 5
- Lagt till `/api/health` och `/api/hello` endpoints
- Konfigurerat Biome (samma linter som frontend)
- Request logging med färgkodning i terminalen
- Uppdaterat `.gitignore` med `.env` och `*.db`
- Lagt till CI-jobb: `api-audit` och `api-lint-build`
