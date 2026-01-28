# Joinly API

Backend API för Joinly-appen.

## Tech Stack

| Teknik | Version | Syfte |
|--------|---------|-------|
| Node.js | 22+ | Runtime |
| TypeScript | 5.7 | Typsäkerhet |
| Express | 5.x | Web framework |
| SQLite | (kommer) | Databas |
| JWT | (kommer) | Autentisering |
| Biome | 2.2 | Linter & formatter |

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

| Metod | Endpoint | Beskrivning |
|-------|----------|-------------|
| GET | `/api/health` | Hälsokontroll (för CI/CD) |
| GET | `/api/hello` | Test-endpoint |

## npm scripts

| Kommando | Beskrivning |
|----------|-------------|
| `npm run dev` | Starta med hot reload |
| `npm run build` | Kompilera TypeScript |
| `npm run start` | Kör produktionsbygge |
| `npm run lint` | Kontrollera kod med Biome |
| `npm run format` | Formatera kod |
| `npm test` | Kör tester |

## Projektstruktur

```
api/
├── src/
│   ├── index.ts      # Express server & routes
│   └── config.ts     # Konfiguration
├── package.json
├── tsconfig.json     # TypeScript config
├── biome.json        # Linter config
└── .env.example      # Mall för miljövariabler
```

## Miljövariabler

Kopiera `.env.example` till `.env` för lokala inställningar:

```bash
cp .env.example .env
```

**OBS:** `.env` är gitignored och ska ALDRIG pushas!

## CI/CD

API:et har två jobb i GitHub Actions (`.github/workflows/ci.yml`):

| Jobb | Syfte |
|------|-------|
| `api-audit` | Säkerhetskontroll av dependencies (`npm audit`) |
| `api-lint-build` | Kodkvalitet (Biome lint + TypeScript build) |

**Varför två separata jobb?**
- Snabbare feedback - du ser direkt *vad* som failade
- Körs parallellt - sparar tid
- Oberoende - ett säkerhetsproblem blockerar inte lint-feedback

## Planerade features

- [ ] Databas (SQLite)
- [ ] Autentisering (JWT + bcrypt)
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
