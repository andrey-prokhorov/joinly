# Säkerhet

Dokumentation av säkerhetsmekanismer i Joinly API:et.

---

## ACL (Access Control List)

Behörigheter styrs via en `acl`-tabell i databasen med 24 regler. Varje request matchas mot dessa regler.

### Flöde vid varje request

1. **Inline JWT-extraktion** - extrahera JWT om den finns (sätter `req.user`)
2. **`createAclMiddleware()`** - hämta ACL-regler, matcha mot metod + route + roll
3. Om `fieldMatchingUserId` finns i regeln → verifiera att användaren äger resursen
4. Ingen matchande regel = **`403 Forbidden`** (secure by default)

### Regeltyper

| `userRoles` | Betydelse | Exempel |
|-------------|-----------|---------|
| `*` | Alla, även ej inloggade | register, login, health |
| `user,admin` | Kräver inloggning | events, registreringar |
| `user` + `fieldMatchingUserId` | Bara ägaren | redigera/ta bort egna events |
| `admin` | Bara admin | redigera/ta bort alla events, hantera ACL |

### Alla 24 ACL-regler

| Roller | Metod | Route | Ägarskapskontroll | Beskrivning |
|--------|-------|-------|-------------------|-------------|
| `*` | POST | `/api/auth/register` | - | Alla kan registrera sig |
| `*` | POST | `/api/auth/login` | - | Alla kan logga in |
| `user,admin` | GET | `/api/auth/me` | - | Hämta profil |
| `user,admin` | POST | `/api/auth/logout` | - | Logga ut |
| `user,admin` | GET | `/api/events` | - | Lista events |
| `user,admin` | GET | `/api/events/:id` | - | Se ett event |
| `user,admin` | GET | `/api/events/filter/search` | - | Filtrera events |
| `user,admin` | GET | `/api/myevents` | - | Se mina events |
| `user,admin` | GET | `/api/myevents/created` | - | Se events jag skapat |
| `user,admin` | POST | `/api/events` | - | Skapa event |
| `user` | PUT | `/api/events/:id` | `creator_user_id` | Redigera egna events |
| `user` | DELETE | `/api/events/:id` | `creator_user_id` | Ta bort egna events |
| `admin` | PUT | `/api/events/:id` | - | Redigera alla events |
| `admin` | DELETE | `/api/events/:id` | - | Ta bort alla events |
| `user,admin` | POST | `/api/events/:eventId/register` | - | Anmäl till event |
| `user,admin` | DELETE | `/api/events/:eventId/register` | - | Avanmäl från event |
| `user,admin` | GET | `/api/events/:eventId/registrations` | - | Se deltagarlista |
| `user,admin` | GET | `/api/events/:id/chat` | - | Hämta chattmeddelanden |
| `user,admin` | POST | `/api/events/:id/chat` | - | Skicka chattmeddelande |
| `*` | GET | `/api/health` | - | Hälsokontroll |
| `admin` | GET | `/api/acl` | - | Se ACL-regler |
| `admin` | POST | `/api/acl` | - | Skapa ACL-regel |
| `admin` | PUT | `/api/acl/:id` | - | Uppdatera ACL-regel |
| `admin` | DELETE | `/api/acl/:id` | - | Ta bort ACL-regel |

### ACL toggle

ACL kan stängas av med `ACL_ENABLED=false` i `.env` (för felsökning). I produktion ska ACL alltid vara på.

### SQL injection-skydd (ACL)

ACL-middleware använder en route-whitelist för att förhindra att manipulerade routes kan användas för SQL injection via dynamiska tabellnamn.

---

## SQL Injection-skydd

API:et skyddas mot SQL injection med **defense in depth** - tre oberoende lager:

### Lager 1: Input-validering

Validators (`src/utils/validators.ts`) använder två strategier: vissa fält blockerar SQL-tecken redan i input, medan andra tillåter dem och förlitar sig på lager 2 (prepared statements):

- **Email-validering** - regex som bara tillåter giltiga email-tecken, blockerar `'`, `;`, `--` etc.
- **Lösenordsvalidering** - längd- och komplexitetskrav
- **Namnvalidering** - längd 2-50 tecken, blockerar HTML-taggar och kontrolltecken men tillåter SQL-tecken (skyddas av lager 2)

### Lager 2: Prepared statements

Alla databasfrågor använder **parameteriserade queries** via better-sqlite3:

```typescript
// Prepared statement - SQL-strängen och data hanteras separat
db.prepare("SELECT * FROM users WHERE email = ?").get(email)
```

Prepared statements gör att användarinput aldrig tolkas som SQL-kod, oavsett innehåll. Även om en angripare skickar `'; DROP TABLE users; --` som namn behandlas det som vanlig text.

### Lager 3: UUID-validering och whitelist

- **UUID-validering** - vissa endpoints (t.ex. uppdatera/ta bort event) validerar event-ID som UUID-format innan databasanrop, medan andra som `GET /api/events/:id` gör parameteriserade queries direkt och ger 404 vid ogiltiga ID:n
- **Route-whitelist** - ACL-middleware matchar bara definierade routes i ACL-tabellen; anrop mot okända routes ger 403

### Testverifiering

SQL injection-skyddet verifieras med 11 automatiserade Newman-tester (`tests/sql-injection.postman_collection.json`):

| Test | Attack-payload | Endpoint | Förväntat |
|------|---------------|----------|-----------|
| 1-3 | `' OR '1'='1'`, UNION SELECT, DROP TABLE | Login (email) | 400 (blockerat av validering) |
| 4 | `' OR '1'='1` | Login (lösenord) | 401 (bcrypt.compare misslyckas) |
| 5-6 | SQL i city/category | Filter-sökning | 200 med tom lista (prepared statement) |
| 7-8 | DROP TABLE, UNION SELECT i namn | Register | 201 - sparas som text, inte exekverat |
| 9 | DROP TABLE i event-titel | Skapa event | 201 - sparas som text |
| 10 | SQL i ID-parameter | Hämta event | 400/404 (UUID-validering) |
| 11 | Health check efter alla attacker | Health | 200 - databasen intakt |

Testerna bevisar att:
- Lager 1 blockerar SQL i email-fält (test 1-3)
- Lager 2 skyddar namn/titel-fält där SQL-tecken tillåts (test 7-9)
- Lager 3 blockerar SQL i ID-parametrar (test 10)
- Databasen överlever alla attacker (test 11)

---

## Token Blacklist (Logout)

JWT-tokens är stateless - servern kan normalt inte invalidera dem innan de går ut. För att möjliggöra riktig utloggning använder vi en **token blacklist**:

1. Vid logout sparas token i `token_blacklist`-tabellen med utgångstid
2. Auth-middleware kontrollerar blacklist **innan** JWT verifieras
3. Utgångna tokens rensas automatiskt vid databasinitiering

Detta ger säkrare sessionshantering, speciellt viktigt om en token komprometteras.

---

## Rate Limiting

Auth-endpoints skyddas mot brute-force:

| Endpoint | Gräns per IP | Gräns per email | Fönster |
|----------|-------------|-----------------|---------|
| `/api/auth/register` | 5 req | - | 15 min |
| `/api/auth/login` | 10 req | 5 req | 15 min |

Login har dubbel rate limiting (IP + email) för att skydda mot distribuerade attacker.

Rate limiting kan stängas av med `RATE_LIMIT_ENABLED=false` i `.env` (för testning/CI).

---

## Timing Attack Prevention

Login-endpointen kör alltid `bcrypt.compare()`, även om användaren inte finns i databasen. Detta förhindrar att en angripare kan mäta svarstiden för att avgöra om en e-postadress är registrerad.

---

## Produktionskrav

Följande **måste** vara korrekt konfigurerat i produktion:

| Krav | Varför |
|------|--------|
| `JWT_SECRET` bytt från default | Servern vägrar starta med default-värdet |
| `ACL_ENABLED=true` | Utan ACL kan alla nå alla endpoints |
| `RATE_LIMIT_ENABLED=true` | Utan rate limiting är brute-force möjlig |
| `NODE_ENV=production` | Styr seed-data, felmeddelanden m.m. |
| `npm audit --omit=dev` passerar | Inga kända sårbarheter i produktionsberoenden |

### Säkerhetskontroll före deploy

```bash
# Kontrollera produktionsberoenden
npm audit --omit=dev

# Verifiera att .env inte finns i repot
git ls-files --error-unmatch .env 2>/dev/null && echo "VARNING: .env trackas!" || echo "OK"

# Verifiera konfiguration
echo "JWT_SECRET ska vara minst 32 tecken"
echo "ACL_ENABLED ska vara true"
echo "RATE_LIMIT_ENABLED ska vara true"
```
