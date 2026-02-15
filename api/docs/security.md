# Säkerhet

Dokumentation av säkerhetsmekanismer i Joinly API:et.

---

## ACL (Access Control List)

Behörigheter styrs via en `acl`-tabell i databasen med 21 regler. Varje request matchas mot dessa regler.

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

### Alla 21 ACL-regler

| Roller | Metod | Route | Ägarskapskontroll | Beskrivning |
|--------|-------|-------|-------------------|-------------|
| `*` | POST | `/api/auth/register` | - | Alla kan registrera sig |
| `*` | POST | `/api/auth/login` | - | Alla kan logga in |
| `user,admin` | GET | `/api/auth/me` | - | Hämta profil |
| `user,admin` | POST | `/api/auth/logout` | - | Logga ut |
| `user,admin` | GET | `/api/events` | - | Lista events |
| `user,admin` | GET | `/api/events/:id` | - | Se ett event |
| `user,admin` | GET | `/api/events/filter/search` | - | Filtrera events |
| `user,admin` | POST | `/api/events` | - | Skapa event |
| `user` | PUT | `/api/events/:id` | `creator_user_id` | Redigera egna events |
| `user` | DELETE | `/api/events/:id` | `creator_user_id` | Ta bort egna events |
| `admin` | PUT | `/api/events/:id` | - | Redigera alla events |
| `admin` | DELETE | `/api/events/:id` | - | Ta bort alla events |
| `user,admin` | POST | `/api/events/:eventId/register` | - | Anmäl till event |
| `user,admin` | DELETE | `/api/events/:eventId/register` | - | Avanmäl från event |
| `user,admin` | GET | `/api/events/:eventId/registrations` | - | Se deltagarlista |
| `*` | GET | `/api/health` | - | Hälsokontroll |
| `admin` | GET | `/api/acl` | - | Se ACL-regler |
| `admin` | POST | `/api/acl` | - | Skapa ACL-regel |
| `admin` | PUT | `/api/acl/:id` | - | Uppdatera ACL-regel |
| `admin` | DELETE | `/api/acl/:id` | - | Ta bort ACL-regel |

### ACL toggle

ACL kan stängas av med `ACL_ENABLED=false` i `.env` (för felsökning). I produktion ska ACL alltid vara på.

### SQL injection-skydd

ACL-middleware använder en route-whitelist för att förhindra att manipulerade routes kan användas för SQL injection via dynamiska tabellnamn.

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
