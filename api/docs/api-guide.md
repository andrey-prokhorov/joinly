# API-guide

Detaljerad guide för att integrera mot Joinly API:et. Riktar sig främst till frontend-utvecklare.

Se [README.md](../README.md) för snabbstart och endpoints-översikt.

---

## Autentisering (JWT)

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

## ACL (rollbaserad åtkomstkontroll)

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

## Felhantering

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

## Endpoint-exempel

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
    "id": "b7f5c2e0-1a2b-4c3d-9e8f-123456789abc",
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
    "id": "b7f5c2e0-1a2b-4c3d-9e8f-123456789abc",
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
  "user": { "id": "b7f5c2e0-1a2b-4c3d-9e8f-123456789abc", "email": "anna@example.com", "role": "user" },
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
  "message": "Registrering genomförd.",
  "registration": {
    "event_id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "b7f5c2e0-1a2b-4c3d-9e8f-123456789abc"
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
  "message": "Avregistrering genomförd."
}
```

**Vanliga fel:**

| Status | Orsak |
|--------|-------|
| 400 | Ogiltigt event-ID |
| 401 | Saknar eller ogiltig token |
| 404 | Eventet finns inte eller du är inte anmäld |

### Hämta mina event-anmälningar

```http
GET /api/myevents
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
      "category": "music",
      "start_time": "2026-03-15T18:00:00Z",
      "city": "Stockholm"
    }
  ],
  "count": 1
}
```

### Hämta events jag skapat

```http
GET /api/myevents/created
Authorization: Bearer <token>
```

**Svar (200):**
```json
{
  "success": true,
  "events": [
    {
      "id": "abc-456",
      "title": "Morgonlöpning Södermalm",
      "category": "Running",
      "start_time": "2026-03-20T07:00:00Z",
      "city": "Stockholm"
    }
  ],
  "count": 1
}
```

### Hämta chattmeddelanden för event

```http
GET /api/events/:id/chat
Authorization: Bearer <token>
```

**Svar (200):**
```json
{
  "success": true,
  "messages": [
    {
      "id": "msg-001",
      "event_id": "abc-123",
      "user_id": "b7f5c2e0-1a2b-4c3d-9e8f-123456789abc",
      "message": "Vad roligt detta ska bli!",
      "created_at": "2026-03-10T14:30:00Z"
    }
  ],
  "count": 1
}
```

**Fel:** 401 om token saknas/ogiltig, 403 om användaren inte är registrerad på eventet, 404 om eventet inte finns.

### Skicka chattmeddelande i event

```http
POST /api/events/:id/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Jag kommer! Ses där!"
}
```

**Svar (201):**
```json
{
  "success": true,
  "message": "Meddelande skapat framgångsrikt.",
  "chatMessage": {
    "id": "msg-002",
    "event_id": "abc-123",
    "user_id": "b7f5c2e0-1a2b-4c3d-9e8f-123456789abc",
    "message": "Jag kommer! Ses där!",
    "created_at": "2026-03-10T15:00:00Z"
  }
}
```

**Vanliga fel:**

| Status | Orsak |
|--------|-------|
| 400 | Tomt meddelande |
| 401 | Saknar eller ogiltig token |
| 403 | Inte registrerad på eventet |
| 404 | Eventet finns inte |
