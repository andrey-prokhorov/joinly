# Joinly

> **Kurs 3 — Live:** Se [Deployment](#deployment-kurs-3) för live-URL:er, pipeline och förklaring till röda "Deployments" i GitHub-sidopanelen.
>
> **Registrering är stängd** i live-miljön. `REGISTRATION_ENABLED=false` är satt i Railway som skydd mot obehöriga och trafik/kostnader. Testinloggning bifogas vid inlämningen.

**Joinly** - en app för att hitta sällskap för träning, snabbt och utan krångel.
Här kan du enkelt hitta eller skapa aktiviteter som löpning, cykling eller motorcykelturer i närheten av dig.
Du behöver inte gå med i grupper eller planera långt i förväg - se vad som händer idag eller imorgon och häng på.

## Teknikstack

| Del | Teknologi |
|-----|-----------|
| Backend | Node.js 22 / Express 5 / TypeScript |
| Databas | SQLite (better-sqlite3) |
| Autentisering | JWT (jsonwebtoken + bcrypt) |
| Frontend | Vite + React 19 + TypeScript |
| UI-bibliotek | Material UI (MUI) |
| Routing | TanStack Router (filbaserad) |
| Linting | Biome (backend + frontend) |
| Tester | Newman (API-integration + SQL injection), Vitest (unit) |
| CI/CD | GitHub Actions |
| Containerisering | Docker (multi-stage builds, non-root) *(Kurs 3)* |
| Image-registry | GitHub Container Registry (GHCR) *(Kurs 3)* |
| Deployment | Railway *(Kurs 3)* |

## Komma igång

Följ stegen nedan för att få igång projektet på din lokala maskin.

### 1. Klona repot

```bash
git clone <repo-url>
cd joinly
```

### 2. Konfigurera miljövariabler (backend)

Backend kräver en `.env`-fil med hemliga variabler. En mall finns i `api/.env.example`.

```bash
cp api/.env.example api/.env
```

Öppna `api/.env` och fyll i värden:

- **JWT_SECRET** - Ändras till en kryptografiskt slumpmässig nyckel (minst 44 tecken, t.ex. `openssl rand -base64 32`)
- **SEED_TESTUSER_1_PASSWORD** m.fl. - Lösenord för seed-användare (krav: 8+ tecken, stor bokstav, liten bokstav, siffra, specialtecken)
- **RATE_LIMIT_ENABLED** - `false` för lokal utveckling, `true` i produktion
- **ACL_ENABLED** - `true` (default). Stäng **aldrig** av i produktion. Vid lokal felsökning kan `false` användas tillfälligt - säkerställ att det återställs innan push

> `.env`-filer är gitignored och ska **aldrig** committas. Använd `.env.example` som referens.

### 3. Installera och starta backend

```bash
cd api
npm install
npm run dev
```

API:et körs på http://localhost:3001

Se [api/README.md](api/README.md) för detaljerad API-dokumentation.

### 4. Installera och starta frontend

```bash
cd app
npm install
npm run dev
```

Frontend körs på http://localhost:3000

> Starta backend först - frontend anropar API:et på port 3001.

## Funktionalitet

- **Registrering och inloggning** - JWT-baserad autentisering
- **Events** - Skapa, visa och hantera aktiviteter
- **Eventanmälan** - Anmäl/avanmäl dig till events
- **Chat inom events** - Registrerade deltagare kan chatta i events
- **Rollbaserad åtkomstkontroll (ACL)** - Middleware som styr behörigheter per endpoint
- **Skyddade routes** - Frontend omdirigerar till login vid utgången session
- **SQL injection-skydd** - Defense in depth: validering, prepared statements, UUID-validering

## Testning

```bash
# Unit-tester (Vitest)
cd api && npm test

# API-integrationstester (Newman)
# Kräver att backend körs (npm run dev i api/)
cd api && npm run test:api

# Lint (Biome)
cd api && npm run lint
cd app && npm run lint
```

## CI/CD

GitHub Actions kör automatiskt vid push och PR:

- Lint (Biome)
- Build (TypeScript-kompilering + Vite)
- Säkerhetsgranskning (npm audit)
- API-integrationstester (Newman)
- *(Kurs 3)* Docker-bygge → GHCR → container scanning (Trivy) → Railway-redeploy

Branch protection är aktiverad på `main` - alla ändringar går via PR.

## Deployment *(Kurs 3)*

Applikationen är driftsatt i Railway:

- **API:** https://api-production-4072.up.railway.app
- **Frontend:** https://app-production-joinly.up.railway.app

Deploy sker automatiskt vid push till `main`: Docker-image byggs → pushas till GHCR → container scanning (Trivy) → Railway startar om med ny image via CLI.

> **OBS — röda "Deployments" i GitHub-sidopanelen:** Det beror på en äldre Railway–GitHub-integration som ersattes av ovanstående pipeline i Kurs 3. Den integrationen försöker fortfarande deploya direkt från GitHub utan Docker-steget och failar därför. Aktiv deployment sker via CI/CD-pipelinen ovan. Se [Wiki: Kurs 3 — Deploy](https://github.com/andrey-prokhorov/joinly/wiki/Kurs3-Deploy) för fullständig dokumentation.

## Git-workflow

Utveckling sker i feature-brancher som mergas till `main` via pull requests.
Branch protection kräver godkänd review och att CI passerar.

## Inlämningsuppgift

Detta är en inlämningsuppgift inom kursen "[DevSecOps med säkerhetsinriktning](https://www.nbi-handelsakademin.se/utbildningar/it-tech/devsecops-med-sakerhetsinriktning/)" på NBI-Handelsakademin.

### Inledning
I denna projektuppgift ska ni i grupp planera, utveckla, integrera och lansera en social webbapplikation med fokus på kontinuerlig utveckling, automation och säker drift i molnmiljö. Projektet genomförs parallellt med kursens undervisningsmoment och utgör kursens examinerande del.

Arbetet ska genomföras med ett DevSecOps-orienterat arbetssätt, där utveckling, testning och säkerhet ses som en sammanhängande helhet snarare än separata faser.

I praktiken ska alla moment representeras i kod som automatiseras som kontinuerlig integration i en produkt.

### Bakgrundsbeskrivning
Moderna webbaserade och sociala applikationer utvecklas i miljöer där kraven på förändringstakt, stabilitet och säkerhet är höga. För att möta dessa krav används idag arbetssätt där:

- funktionalitet utvecklas och integreras löpande
- testning och kvalitetssäkring automatiseras
- driftsättning sker kontinuerligt och reproducerbart
- säkerhet och integritet hanteras tidigt i processen
- Projektuppgiften är utformad för att ge er praktisk erfarenhet av dessa principer, med särskilt fokus på CI och säker systemutveckling.

Läs mer om uppgiften [här](https://dsoht25d-hak.lms.nodehill.se/article/projektuppgift-devsevops-kultur-processer-och-automation).
