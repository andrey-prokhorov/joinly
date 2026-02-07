# Delad Databasanslutning

Denna fil löser problemet med flera databasanslutningar genom att skapa en enda delad anslutning som alla filer använder.

## Problem som löstes

Tidigare hade vi:
- `database-users.ts` - skapade sin egen anslutning till `joinly.db`
- `database-events.ts` - skapade sin egen anslutning till samma `joinly.db`

Detta kunde orsaka problem med SQLite eftersom den föredrar en enda delad anslutning.

## Ny struktur

Nu har vi:
- `database.ts` - en enda delad anslutning med explicit kontroll
- `database-users.ts` - re-exporterar den delade anslutningen 
- `database-events.ts` - re-exporterar den delade anslutningen

## Användning

### Automatisk initialisering (default)
```typescript
import db from "./db/database.js";

// Tabeller och seed-data skapas automatiskt i development
const users = db.prepare("SELECT * FROM users").all();
```

### Explicit kontroll
```typescript
import db, { initDatabase, seedData, seedUsers, seedEvents } from "./db/database.js";

// Initiera bara tabeller
initDatabase();

// Seed bara användare
seedUsers();

// Seed bara events  
seedEvents();

// Seed all data
seedData();
```

### Bakåtkompatibilitet
Befintliga imports fungerar fortfarande:
```typescript
import db from "./db/database-users.js"; // Fungerar!
import db from "./db/database-events.js"; // Fungerar!
```

## Fördelar

✅ **En enda databasanslutning** - Inga konflikter mellan läs/skriv-operationer  
✅ **Explicit kontroll** - Du kan välja när tabeller initieras och seedas  
✅ **Bakåtkompatibilitet** - Befintlig kod fungerar utan ändringar  
✅ **Centraliserad hantering** - All databaslogik på ett ställe  
✅ **Bättre prestanda** - Mindre overhead med färre anslutningar  

## Funktioner

- `initDatabase()` - Skapar alla tabeller
- `seedData()` - Seedar all testdata (endast i development)
- `seedUsers()` - Seedar bara användare
- `seedEvents()` - Seedar bara events

## Produktion vs Development

- **Development**: Tabeller och seed-data skapas automatiskt
- **Production**: Endast tabeller skapas, ingen seed-data