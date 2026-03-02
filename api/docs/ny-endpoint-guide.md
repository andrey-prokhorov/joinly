# Guide: Lägga till ny endpoint i Joinly API

Denna guide beskriver steg-för-steg hur en ny utvecklare kan lägga till en ny endpoint i Joinly API och generera all nödvändig Swagger-dokumentation.

## Förutsättningar

- Node.js ≥22.0.0
- Grundläggande kunskap om TypeScript och Express.js
- Förståelse för REST API-principer

## Projektstruktur

```
src/
├── routes/          # API endpoints
├── middleware/      # ACL och autentisering
├── db/             # Databasoperationer
├── utils/          # Valideringar mm
├── config.ts       # Konfiguration
├── swagger.js      # Swagger schemas
└── index.ts        # Huvudfil
```

## Steg 1: Förstå projektkonfigurationen

### Autentisering och auktorisering
- Projektet använder JWT för autentisering
- ACL (Access Control List) för auktorisering baserat på databasregler
- Tokens kan blacklistas (utloggning)

### Swagger-konfiguration
- Swagger UI tillgängligt på `/swagger`
- Schemas definieras i `src/swagger.js`
- Dokumentation skapas via JSDoc-kommentarer i route-filerna

## Steg 2: Planera din endpoint

Innan du börjar koda, definiera:
- **URI-struktur**: `/api/[resurskategori]/[specifik-resurs]`
- **HTTP-metoder**: GET, POST, PUT, DELETE
- **Datamodell**: Vilka fält behövs?
- **Säkerhetskrav**: Behöver endpoint autentisering/auktorisering?

### Exempel: Vi skapar en "notifications" endpoint

```
GET    /api/notifications       # Hämta användarens notifikationer
POST   /api/notifications       # Skapa ny notifikation
PUT    /api/notifications/:id   # Uppdatera notifikation
DELETE /api/notifications/:id   # Radera notifikation
```

## Steg 3: Skapa databasstruktur (om behövs)

Om din endpoint behöver nya databastabeller, uppdatera databasfiler:

**1. Skapa `src/db/database-notifications.ts`:**

```typescript
import type Database from "better-sqlite3"

export function createNotificationsTable(db: Database.Database) {
    db.exec(`
        CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT CHECK(type IN ('info', 'warning', 'error', 'success')) DEFAULT 'info',
            read BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    `)
    
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
    `)
}

export function seedNotificationsData(db: Database.Database) {
    // Lägg till test-data här om behövs
    const sampleNotifications = [
        {
            id: "notif-001",
            user_id: "user-001",
            title: "Välkommen!",
            message: "Välkommen till Joinly!",
            type: "success"
        }
    ]
    
    const insertNotification = db.prepare(`
        INSERT OR IGNORE INTO notifications 
        (id, user_id, title, message, type) 
        VALUES (?, ?, ?, ?, ?)
    `)
    
    for (const notif of sampleNotifications) {
        insertNotification.run(notif.id, notif.user_id, notif.title, notif.message, notif.type)
    }
}
```

**2. Uppdatera `src/db/database.ts`:**

```typescript
// Lägg till import
import { createNotificationsTable, seedNotificationsData } from "./database-notifications.js"

// I initDatabase() funktionen
export function initDatabase() {
    // ... befintlig kod ...
    createNotificationsTable(db)
}

// I seedData() funktionen  
export function seedData() {
    // ... befintlig kod ...
    seedNotificationsData(db)
}
```

## Steg 4: Definiera Swagger schemas

**Uppdatera `src/swagger.js` - lägg till i schemas objektet:**

```javascript
Notification: {
    type: "object",
    properties: {
        id: {
            type: "string",
            example: "notif-001",
            description: "Unique identifier for the notification",
        },
        user_id: {
            type: "string",
            format: "uuid", 
            example: "550e8400-e29b-41d4-a716-446655440000",
            description: "ID of the user who owns the notification",
        },
        title: {
            type: "string",
            example: "Ny eventinbjudan",
            description: "Notification title",
        },
        message: {
            type: "string", 
            example: "Du har blivit inbjuden till Summer Music Festival",
            description: "Notification message content",
        },
        type: {
            type: "string",
            enum: ["info", "warning", "error", "success"],
            example: "info",
            description: "Type of notification",
        },
        read: {
            type: "boolean",
            example: false,
            description: "Whether the notification has been read",
        },
        created_at: {
            type: "string",
            format: "date-time",
            example: "2024-07-15T18:00:00Z", 
            description: "When the notification was created",
        },
    },
    required: ["id", "user_id", "title", "message", "type", "read", "created_at"],
},
CreateNotificationRequest: {
    type: "object", 
    properties: {
        title: {
            type: "string",
            example: "Ny eventinbjudan",
            description: "Notification title",
        },
        message: {
            type: "string",
            example: "Du har blivit inbjuden till Summer Music Festival", 
            description: "Notification message",
        },
        type: {
            type: "string",
            enum: ["info", "warning", "error", "success"],
            example: "info",
            description: "Type of notification",
        },
        target_user_id: {
            type: "string",
            format: "uuid",
            example: "550e8400-e29b-41d4-a716-446655440000",
            description: "ID of user to notify (for admin use)",
        },
    },
    required: ["title", "message"],
},
```

## Steg 5: Skapa route-filen

**Skapa `src/routes/notifications.ts`:**

```typescript
import { type Response, Router } from "express"
import db from "../db/database.js"
import type { AuthRequest } from "../middleware/auth.js"

const router = Router()

// TypeScript interface för Notification
interface DbNotification {
    id: string
    user_id: string
    title: string
    message: string
    type: 'info' | 'warning' | 'error' | 'success'
    read: boolean
    created_at: string
}

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     summary: Get user's notifications
 *     description: Retrieve all notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unread_only
 *         schema:
 *           type: boolean
 *         description: Only return unread notifications
 *     responses:
 *       200:
 *         description: Successfully retrieved notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 notifications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 count:
 *                   type: number
 *                   example: 5
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get("/", (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Autentisering krävs."
            })
        }

        const { unread_only } = req.query
        let query = "SELECT * FROM notifications WHERE user_id = ?"
        const params: any[] = [req.user.sub]

        if (unread_only === 'true') {
            query += " AND read = FALSE"
        }

        query += " ORDER BY created_at DESC"

        const notifications = db.prepare(query).all(...params) as DbNotification[]

        res.json({
            success: true,
            notifications,
            count: notifications.length,
        })
    } catch (error) {
        console.error("Fel vid hämtning av notifikationer:", error)
        res.status(500).json({
            success: false,
            message: "Internt serverfel vid hämtning av notifikationer."
        })
    }
})

/**
 * @openapi
 * /api/notifications:
 *   post:
 *     summary: Create a new notification
 *     description: Create a notification for the authenticated user, or for another user if admin
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateNotificationRequest'
 *     responses:
 *       201:
 *         description: Notification created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 notification:
 *                   $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Bad request - Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Cannot create notification for other user
 *       500:
 *         description: Internal server error
 */
router.post("/", (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Autentisering krävs."
            })
        }

        const { title, message, type = 'info', target_user_id } = req.body

        // Validering
        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: "Titel och meddelande är obligatoriska."
            })
        }

        if (!['info', 'warning', 'error', 'success'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Ogiltig notifikationstyp."
            })
        }

        // Bestäm måluser - om target_user_id specificeras, kräv admin-behörighet
        let userId = req.user.sub
        if (target_user_id) {
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: "Endast administratörer kan skapa notifikationer för andra användare."
                })
            }
            userId = target_user_id
        }

        // Skapa notifikation
        const stmt = db.prepare(`
            INSERT INTO notifications (user_id, title, message, type)
            VALUES (?, ?, ?, ?)
        `)
        
        const result = stmt.run(userId, title, message, type)
        const notificationId = result.lastInsertRowid

        // Hämta den skapade notifikationen
        const notification = db.prepare(
            "SELECT * FROM notifications WHERE rowid = ?"
        ).get(notificationId) as DbNotification

        res.status(201).json({
            success: true,
            notification
        })
    } catch (error) {
        console.error("Fel vid skapande av notifikation:", error)
        res.status(500).json({
            success: false,
            message: "Internt serverfel vid skapande av notifikation."
        })
    }
})

/**
 * @openapi
 * /api/notifications/{id}:
 *   put:
 *     summary: Mark notification as read/unread
 *     description: Update the read status of a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               read:
 *                 type: boolean
 *                 description: Mark as read (true) or unread (false)
 *             required: [read]
 *     responses:
 *       200:
 *         description: Notification updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 notification:
 *                   $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id", (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Autentisering krävs."
            })
        }

        const { id } = req.params
        const { read } = req.body

        if (typeof read !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: "Fältet 'read' måste vara boolean."
            })
        }

        // Kontrollera att notifikationen tillhör användaren
        const notification = db.prepare(
            "SELECT * FROM notifications WHERE id = ? AND user_id = ?"
        ).get(id, req.user.sub) as DbNotification

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notifikation hittades inte."
            })
        }

        // Uppdatera
        db.prepare("UPDATE notifications SET read = ? WHERE id = ?")
          .run(read, id)

        // Hämta uppdaterad notifikation  
        const updatedNotification = db.prepare(
            "SELECT * FROM notifications WHERE id = ?"
        ).get(id) as DbNotification

        res.json({
            success: true,
            notification: updatedNotification
        })
    } catch (error) {
        console.error("Fel vid uppdatering av notifikation:", error)
        res.status(500).json({
            success: false,
            message: "Internt serverfel vid uppdatering av notifikation."
        })
    }
})

/**
 * @openapi
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     description: Delete a notification (only owner or admin)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Notifikation raderad."
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Autentisering krävs."
            })
        }

        const { id } = req.params

        // Kontrollera att notifikationen finns och tillhör användaren (eller är admin)
        let query = "SELECT * FROM notifications WHERE id = ?"
        let params = [id]
        
        if (req.user.role !== 'admin') {
            query += " AND user_id = ?"
            params.push(req.user.sub)
        }

        const notification = db.prepare(query).get(...params) as DbNotification

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notifikation hittades inte."
            })
        }

        // Radera notifikation
        db.prepare("DELETE FROM notifications WHERE id = ?").run(id)

        res.json({
            success: true,
            message: "Notifikation raderad."
        })
    } catch (error) {
        console.error("Fel vid radering av notifikation:", error)
        res.status(500).json({
            success: false,
            message: "Internt serverfel vid radering av notifikation."
        })
    }
})

export default router
```

## Steg 6: Registrera route i huvudfilen

**Uppdatera `src/index.ts`:**

```typescript
// Lägg till import
import notificationRoutes from "./routes/notifications.js"

// Lägg till route (efter de andra routes)
app.use("/api/notifications", notificationRoutes)
```

## Steg 7: Konfigurera ACL (om behövs)

Om din endpoint behöver specifika behörighetsregler, uppdatera ACL-konfigurationen:

**Uppdatera `src/db/database-acl.ts`:**

```typescript
// Lägg till ACL-regler för notifikationer
const aclRules = [
    // ... befintliga regler ...
    
    // Notifications - alla autentiserade användare kan hantera sina egna
    {
        resource_pattern: "/api/notifications",
        method: "GET",
        roles: "user,admin",
        conditions: null
    },
    {
        resource_pattern: "/api/notifications",  
        method: "POST",
        roles: "user,admin", 
        conditions: null
    },
    {
        resource_pattern: "/api/notifications/*",
        method: "PUT",
        roles: "user,admin",
        conditions: null
    },
    {
        resource_pattern: "/api/notifications/*", 
        method: "DELETE",
        roles: "user,admin",
        conditions: null
    }
]
```

## Steg 8: Testa och generera dokumentation

### 1. Starta utvecklingsservern
```bash
npm run dev
```

### 2. Testa endpoints manuellt
- API: `http://localhost:3000/api/notifications`
- Swagger UI: `http://localhost:3000/swagger`

### 3. Generera OpenAPI-specifikation
```bash
npm run openapi:gen
```

Detta skapar:
- `openapi/openapi.yaml` 
- `openapi/openapi.json`

### 4. Skapa Postman-tester (valfritt)

**Skapa `tests/notifications.postman_collection.json`:**

```json
{
    "info": {
        "name": "Joinly API - Notifications",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "variable": [
        {
            "key": "baseUrl",
            "value": "http://localhost:3000"
        }
    ],
    "item": [
        {
            "name": "Get Notifications",
            "request": {
                "method": "GET",
                "header": [
                    {
                        "key": "Authorization", 
                        "value": "Bearer {{authToken}}"
                    }
                ],
                "url": "{{baseUrl}}/api/notifications"
            }
        },
        {
            "name": "Create Notification",
            "request": {
                "method": "POST",
                "header": [
                    {
                        "key": "Authorization",
                        "value": "Bearer {{authToken}}"
                    },
                    {
                        "key": "Content-Type",
                        "value": "application/json"
                    }
                ],
                "body": {
                    "mode": "raw",
                    "raw": "{\n    \"title\": \"Test Notification\",\n    \"message\": \"Detta är en testnotifikation.\",\n    \"type\": \"info\"\n}"
                },
                "url": "{{baseUrl}}/api/notifications"
            }
        }
    ]
}
```

**Lägg till test-script i `package.json`:**

```json
"test:api:notifications": "newman run tests/notifications.postman_collection.json"
```

## Swagger-dokumentation Best Practices

### 1. Använd beskrivande kommentarer
```typescript
/**
 * @openapi
 * /api/resource:
 *   get:
 *     summary: Kort beskrivning (max 50 tecken)
 *     description: Längre beskrivning av vad endpoint:en gör
 *     tags: [ResourceCategory]  # Gruppera relaterade endpoints
 *     security:
 *       - bearerAuth: []  # Kräv autentisering
 */
```

### 2. Definiera alla parameters
```typescript
/**
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier
 *       - in: query  
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 */
```

### 3. Dokumentera alla response-koder
```typescript
/**
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/YourSchema'
 *       400:
 *         description: Bad request - Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Resource not found
 *       500:
 *         description: Internal server error
 */
```

### 4. Använd schema-referenser
```typescript
// I swagger.js - definiera återanvändbara schemas
MyResource: {
    type: "object",
    properties: {
        id: { type: "string", example: "123" },
        name: { type: "string", example: "Example" }
    },
    required: ["id", "name"]
}

// I route-filer - referera till schemas
/**
 *         schema:
 *           $ref: '#/components/schemas/MyResource'
 */
```

## Checklista - Ny endpoint

- [ ] **Databas**: Skapa tabeller och uppdatera `database.ts`
- [ ] **Schema**: Lägg till Swagger schemas i `swagger.js`
- [ ] **Route**: Skapa route-fil i `src/routes/`
- [ ] **JSDoc**: Dokumentera alla endpoints med `@openapi`
- [ ] **Import**: Registrera route i `src/index.ts`
- [ ] **ACL**: Konfigurera behörigheter i `database-acl.ts`
- [ ] **Test**: Testa endpoints manuellt
- [ ] **OpenAPI**: Generera dokumentation med `npm run openapi:gen`
- [ ] **Postman**: Skapa test-collection (valfritt)
- [ ] **Validering**: Kontrollera Swagger UI är korrekt

## Källfiler att känna till

- **`src/index.ts`** - Huvudfil, middleware-konfiguration
- **`src/swagger.js`** - Swagger schemas och konfiguration  
- **`src/routes/`** - API endpoints med JSDoc-dokumentation
- **`src/db/database.ts`** - Databasinitalisering
- **`src/middleware/acl.ts`** - Access Control Lists
- **`scripts/generate-openapi.js`** - Genererar OpenAPI-filer
- **`package.json`** - Scripts och dependencies

## Felsökning

### Swagger UI visar inte min endpoint
1. Kontrollera att JSDoc-kommentarer använder `@openapi` 
2. Kolla att route-filen är importerad i `src/index.ts`
3. Starta om dev-servern (`npm run dev`)

### Schema visas inte korrekt
1. Kontrollera syntax i `swagger.js`
2. Använd rätt `$ref` path: `#/components/schemas/SchemaName`
3. Generera ny OpenAPI-specifikation: `npm run openapi:gen`

### ACL nekar åtkomst
1. Kontrollera ACL-regler i `database-acl.ts` 
2. Verifiera användarens roll och behörigheter
3. Kolla att JWT-token är giltig

Med denna guide kan nya utvecklare snabbt komma igång med att lägga till endpoints som följer projektets konventioner och automatiskt genererar korrekt Swagger-dokumentation.