// Maxlängd för chatmeddelande
const MAX_CHAT_MESSAGE_LENGTH = 3000

import { type Response, Router } from "express"
import db from "../db/database.js"
import type { AuthRequest } from "../middleware/auth.js"

const router = Router()

// Typ för Event från databasen
interface DbEvent {
	id: string
	title: string
	description: string
	category: string
	start_time: string
	end_time: string
	city: string
	city_district: string
	creator_user_id: string
	created_at: string
}

// Typ för ChatMessage från databasen
interface DbChatMessage {
	id: string
	event_id: string
	user_id: string
	message: string
	created_at: string
}

/**
 * @openapi
 * /api/events:
 *   get:
 *     summary: Get all events
 *     description: Retrieve all events ordered by start time
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 events:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *                 count:
 *                   type: number
 *                   example: 5
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
// GET /api/events - hämta alla events
router.get("/", (_req: AuthRequest, res: Response) => {
	try {
		const events = db
			.prepare("SELECT * FROM events ORDER BY start_time ASC")
			.all() as DbEvent[]

		res.json({
			success: true,
			events,
			count: events.length,
		})
	} catch (error) {
		console.error("Fel vid hämtning av events:", error)
		res.status(500).json({
			success: false,
			message: "Internt serverfel vid hämtning av events.",
		})
	}
})

/**
 * @openapi
 * /api/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     description: Retrieve a specific event by its ID
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID (UUID)
 *     responses:
 *       200:
 *         description: Successfully retrieved event
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 event:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         description: Bad request - Event ID is required
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Event not found
 *       500:
 *         description: Internal server error
 */
// GET /api/events/:id - hämta event med specifikt id
router.get("/:id", (req: AuthRequest, res: Response) => {
	const { id } = req.params

	if (!id) {
		return res.status(400).json({
			success: false,
			message: "Event ID krävs.",
		})
	}

	try {
		const event = db.prepare("SELECT * FROM events WHERE id = ?").get(id) as
			| DbEvent
			| undefined

		if (!event) {
			return res.status(404).json({
				success: false,
				message: "Event med detta ID hittades inte.",
			})
		}

		res.json({
			success: true,
			event,
		})
	} catch (error) {
		console.error("Fel vid hämtning av event:", error)
		res.status(500).json({
			success: false,
			message: "Internt serverfel vid hämtning av event.",
		})
	}
})

/**
 * @openapi
 * /api/events/filter/search:
 *   get:
 *     summary: Filter events
 *     description: Search and filter events by various criteria
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city (case-insensitive)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category (case-insensitive)
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter events starting from this date
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter events ending before this date
 *     responses:
 *       200:
 *         description: Successfully filtered events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 events:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *                 count:
 *                   type: number
 *                   example: 3
 *                 filters:
 *                   type: object
 *                   properties:
 *                     city:
 *                       type: string
 *                       nullable: true
 *                     category:
 *                       type: string
 *                       nullable: true
 *                     date_from:
 *                       type: string
 *                       nullable: true
 *                     date_to:
 *                       type: string
 *                       nullable: true
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
// GET /api/events/filter - hämta events med filter
router.get("/filter/search", (req: AuthRequest, res: Response) => {
	const { city, category, date_from, date_to } = req.query

	try {
		let query = "SELECT * FROM events WHERE 1=1"
		const params: string[] = []

		// Filter för stad
		if (city && typeof city === "string") {
			query += " AND LOWER(city) = LOWER(?)"
			params.push(city)
		}

		// Filter för kategori
		if (category && typeof category === "string") {
			query += " AND LOWER(category) = LOWER(?)"
			params.push(category)
		}

		// Filter för datum från
		if (date_from && typeof date_from === "string") {
			query += " AND start_time >= ?"
			params.push(date_from)
		}

		// Filter för datum till
		if (date_to && typeof date_to === "string") {
			query += " AND end_time <= ?"
			params.push(date_to)
		}

		query += " ORDER BY start_time ASC"

		const events = db.prepare(query).all(params) as DbEvent[]

		res.json({
			success: true,
			events,
			count: events.length,
			filters: {
				city: city || null,
				category: category || null,
				date_from: date_from || null,
				date_to: date_to || null,
			},
		})
	} catch (error) {
		console.error("Fel vid filtrering av events:", error)
		res.status(500).json({
			success: false,
			message: "Internt serverfel vid filtrering av events.",
		})
	}
})

/**
 * @openapi
 * /api/events/my:
 *   get:
 *     summary: Get events that user is registered for
 *     description: Retrieve events that the authenticated user is registered for
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched users registered events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 events:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *                 count:
 *                   type: number
 *                   example: 3
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
// GET /api/events/my - hämta mina events (de jag är registrerad på)
router.get("/my", (req: AuthRequest, res: Response) => {
	const userId = req.user?.id
	if (!userId) {
		return res.status(401).json({
			success: false,
			message: "Oauktoriserad användare.",
		})
	}
	try {
		const events = db
			.prepare(
				`SELECT e.* FROM events e
				JOIN event_registrations er ON e.id = er.event_id
				WHERE er.user_id = ?`
			)
			.all(userId) as DbEvent[]

		res.json({
			success: true,
			events,
			count: events.length,
		})
	} catch (error) {
		console.error("Fel vid hämtning av användarens events:", error)
		res.status(500).json({
			success: false,
			message: "Internt serverfel vid hämtning av användarens events.",
		})
	}
})

/**
 * @openapi
 * /api/events:
 *   post:
 *     summary: Create new event
 *     description: Create a new event with required information
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *               - start_time
 *               - end_time
 *               - city
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Summer Music Festival"
 *               description:
 *                 type: string
 *                 example: "A great music festival with local artists"
 *               category:
 *                 type: string
 *                 example: "music"
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-07-15T18:00:00Z"
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-07-15T23:00:00Z"
 *               city:
 *                 type: string
 *                 example: "Stockholm"
 *               city_district:
 *                 type: string
 *                 example: "Södermalm"
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Event created successfully
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
 *                   example: "Event skapat framgångsrikt."
 *                 event:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         description: Bad request - Missing required fields or invalid data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
// POST /api/events - skapa nytt event
router.post("/", (req: AuthRequest, res: Response) => {
	const {
		title,
		description,
		category,
		start_time,
		end_time,
		city,
		city_district,
	} = req.body

	// Validera required fields
	if (
		!title ||
		!description ||
		!category ||
		!start_time ||
		!end_time ||
		!city
	) {
		return res.status(400).json({
			success: false,
			message:
				"Titel, beskrivning, kategori, starttid, sluttid och stad krävs.",
		})
	}

	// Validera datum format och logik
	const startDate = new Date(start_time)
	const endDate = new Date(end_time)

	if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
		return res.status(400).json({
			success: false,
			message: "Ogiltigt datumformat. Använd ISO 8601 format.",
		})
	}

	if (startDate >= endDate) {
		return res.status(400).json({
			success: false,
			message: "Starttid måste vara före sluttid.",
		})
	}

	try {
		const id = crypto.randomUUID()
		const created_at = new Date().toISOString()

		const insertEvent = db.prepare(`
			INSERT INTO events (id, title, description, category, start_time, end_time, city, city_district, creator_user_id, created_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`)

		const creatorUserId = req.user?.id

		if (!creatorUserId) {
			return res.status(401).json({
				success: false,
				message: "Oauktoriserad användare.",
			})
		}

		const result = insertEvent.run(
			id,
			title,
			description,
			category,
			start_time,
			end_time,
			city,
			city_district,
			String(creatorUserId),
			created_at
		)

		if (result.changes > 0) {
			// Hämta det skapade eventet
			const newEvent = db
				.prepare("SELECT * FROM events WHERE id = ?")
				.get(id) as DbEvent

			res.status(201).json({
				success: true,
				message: "Event skapat framgångsrikt.",
				event: newEvent,
			})
		} else {
			res.status(500).json({
				success: false,
				message: "Misslyckades att skapa event.",
			})
		}
	} catch (error) {
		console.error("Fel vid skapande av event:", error)
		res.status(500).json({
			success: false,
			message: "Internt serverfel vid skapande av event.",
		})
	}
})

/**
 * @openapi
 * /api/events/{id}:
 *   put:
 *     summary: Update event
 *     description: Update an existing event by ID (partial updates allowed)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Summer Music Festival"
 *               description:
 *                 type: string
 *                 example: "Updated description for the music festival"
 *               category:
 *                 type: string
 *                 example: "music"
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-07-15T19:00:00Z"
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-07-16T01:00:00Z"
 *               city:
 *                 type: string
 *                 example: "Göteborg"
 *               city_district:
 *                 type: string
 *                 example: "Centrum"
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Event updated successfully
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
 *                   example: "Event uppdaterat framgångsrikt."
 *                 event:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         description: Bad request - Invalid data or no fields to update
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Only event creator can update
 *       404:
 *         description: Event not found
 *       500:
 *         description: Internal server error
 */
// PUT /api/events/:id - uppdatera event
router.put("/:id", (req: AuthRequest, res: Response) => {
	const { id } = req.params
	const {
		title,
		description,
		category,
		start_time,
		end_time,
		city,
		city_district,
	} = req.body

	if (!id) {
		return res.status(400).json({
			success: false,
			message: "Event ID krävs.",
		})
	}

	try {
		// Kontrollera att eventet existerar
		const existingEvent = db
			.prepare("SELECT * FROM events WHERE id = ?")
			.get(id) as DbEvent | undefined

		if (!existingEvent) {
			return res.status(404).json({
				success: false,
				message: "Event med detta ID hittades inte.",
			})
		}

		// Bygg query dynamiskt baserat på vilka fält som skickas
		const updates: string[] = []
		const params: string[] = []

		if (title !== undefined) {
			updates.push("title = ?")
			params.push(title)
		}

		if (description !== undefined) {
			updates.push("description = ?")
			params.push(description)
		}

		if (category !== undefined) {
			updates.push("category = ?")
			params.push(category)
		}

		if (start_time !== undefined) {
			const startDate = new Date(start_time)
			if (Number.isNaN(startDate.getTime())) {
				return res.status(400).json({
					success: false,
					message: "Ogiltigt startdatumformat.",
				})
			}
			updates.push("start_time = ?")
			params.push(start_time)
		}

		if (end_time !== undefined) {
			const endDate = new Date(end_time)
			if (Number.isNaN(endDate.getTime())) {
				return res.status(400).json({
					success: false,
					message: "Ogiltigt slutdatumformat.",
				})
			}
			updates.push("end_time = ?")
			params.push(end_time)
		}

		if (city !== undefined) {
			updates.push("city = ?")
			params.push(city)
		}

		if (city_district !== undefined) {
			updates.push("city_district = ?")
			params.push(city_district)
		}

		if (updates.length === 0) {
			return res.status(400).json({
				success: false,
				message: "Inga fält att uppdatera.",
			})
		}

		// Validera datum logik om båda datumen uppdateras eller finns
		const updatedStartsAt = start_time || existingEvent.start_time
		const updatedEndsAt = end_time || existingEvent.end_time

		if (new Date(updatedStartsAt) >= new Date(updatedEndsAt)) {
			return res.status(400).json({
				success: false,
				message: "Starttid måste vara före sluttid.",
			})
		}

		// Utför uppdatering
		params.push(id as string) // Lägg till ID sist för WHERE clause
		const query = `UPDATE events SET ${updates.join(", ")} WHERE id = ?`

		const result = db.prepare(query).run(params)

		if (result.changes > 0) {
			// Hämta det uppdaterade eventet
			const updatedEvent = db
				.prepare("SELECT * FROM events WHERE id = ?")
				.get(id) as DbEvent

			res.json({
				success: true,
				message: "Event uppdaterat framgångsrikt.",
				event: updatedEvent,
			})
		} else {
			// Inga rader ändrades; i SQLite kan detta innebära att värdena var oförändrade.
			// Eftersom vi redan har verifierat att eventet existerar, betraktar vi detta som en lyckad, idempotent uppdatering.
			res.json({
				success: true,
				message: "Inga ändringar gjordes på eventet.",
				event: existingEvent,
			})
		}
	} catch (error) {
		console.error("Fel vid uppdatering av event:", error)
		res.status(500).json({
			success: false,
			message: "Internt serverfel vid uppdatering av event.",
		})
	}
})

/**
 * @openapi
 * /api/events/{id}:
 *   delete:
 *     summary: Delete event
 *     description: Delete an existing event by ID
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID (UUID)
 *     responses:
 *       200:
 *         description: Event deleted successfully
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
 *                   example: "Event borttaget framgångsrikt."
 *                 deletedEvent:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         description: Bad request - Event ID is required
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Only event creator can delete
 *       404:
 *         description: Event not found
 *       500:
 *         description: Internal server error
 */
// DELETE /api/events/:id - ta bort event
router.delete("/:id", (req: AuthRequest, res: Response) => {
	const { id } = req.params

	if (!id) {
		return res.status(400).json({
			success: false,
			message: "Event ID krävs.",
		})
	}

	try {
		// Kontrollera att eventet existerar först
		const existingEvent = db
			.prepare("SELECT * FROM events WHERE id = ?")
			.get(id) as DbEvent | undefined

		if (!existingEvent) {
			return res.status(404).json({
				success: false,
				message: "Event med detta ID hittades inte.",
			})
		}

		// Ta bort eventet
		const result = db.prepare("DELETE FROM events WHERE id = ?").run(id)

		if (result.changes > 0) {
			res.json({
				success: true,
				message: "Event borttaget framgångsrikt.",
				deletedEvent: existingEvent,
			})
		} else {
			res.status(500).json({
				success: false,
				message: "Misslyckades att ta bort event.",
			})
		}
	} catch (error) {
		console.error("Fel vid borttagning av event:", error)
		res.status(500).json({
			success: false,
			message: "Internt serverfel vid borttagning av event.",
		})
	}
})

/**
 * @openapi
 * /api/events/{id}/chat:
 *   get:
 *     summary: Get event chat messages
 *     description: Retrieve all chat messages for a specific event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID (UUID)
 *     responses:
 *       200:
 *         description: Successfully retrieved chat messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChatMessage'
 *                 count:
 *                   type: number
 *       400:
 *         description: Bad request - Event ID is required
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Event not found
 *       500:
 *         description: Internal server error
 */
//get api/events/:id/chat - hämta chatmeddelanden för event
router.get("/:id/chat", (req: AuthRequest, res: Response) => {
	const { id } = req.params

	if (!id) {
		return res.status(400).json({
			success: false,
			message: "Event ID krävs.",
		})
	}

	try {
		// Kontrollera att eventet existerar
		const event = db.prepare("SELECT * FROM events WHERE id = ?").get(id) as
			| DbEvent
			| undefined

		if (!event) {
			return res.status(404).json({
				success: false,
				message: "Event med detta ID hittades inte.",
			})
		}

		// Kontrollera att användaren är registrerad för eventet
		const userId = req.user?.id
		if (!userId) {
			return res.status(401).json({
				success: false,
				message: "Oauktoriserad användare.",
			})
		}

		const registration = db
			.prepare(
				"SELECT * FROM event_registrations WHERE event_id = ? AND user_id = ?"
			)
			.get(id, String(userId)) as
			| {
					id: number
					event_id: string
					user_id: string
					created_at: string
			  }
			| undefined

		if (!registration) {
			return res.status(403).json({
				success: false,
				message: "Du är inte registrerad för detta event.",
			})
		}

		// Hämta alla chatmeddelanden för eventet
		const messages = db
			.prepare(
				"SELECT * FROM chat_messages WHERE event_id = ? ORDER BY created_at ASC"
			)
			.all(id) as DbChatMessage[]

		res.json({
			success: true,
			messages,
			count: messages.length,
		})
	} catch (error) {
		console.error("Fel vid hämtning av chatmeddelanden:", error)
		res.status(500).json({
			success: false,
			message: "Internt serverfel vid hämtning av chatmeddelanden.",
		})
	}
})

/**
 * @openapi
 * /api/events/{id}/chat:
 *   post:
 *     summary: Post chat message to event
 *     description: Add a new chat message to an event's discussion
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 example: "This event looks great!"
 *     responses:
 *       201:
 *         description: Message posted successfully
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
 *                   example: "Meddelande skapat framgångsrikt."
 *                 chatMessage:
 *                   $ref: '#/components/schemas/ChatMessage'
 *       400:
 *         description: Bad request - Missing required fields
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Event not found
 *       500:
 *         description: Internal server error
 */
router.post("/:id/chat", (req: AuthRequest, res: Response) => {
	const { id } = req.params
	const { message } = req.body

	if (!id) {
		return res.status(400).json({
			success: false,
			message: "Event ID krävs.",
		})
	}

	if (!message || typeof message !== "string" || message.trim() === "") {
		return res.status(400).json({
			success: false,
			message: "Meddelande krävs och får inte vara tomt.",
		})
	}

	if (message.length > MAX_CHAT_MESSAGE_LENGTH) {
		return res.status(400).json({
			success: false,
			message: `Meddelande får vara max ${MAX_CHAT_MESSAGE_LENGTH} tecken långt.`,
		})
	}

	try {
		// Kontrollera att eventet existerar
		const event = db.prepare("SELECT * FROM events WHERE id = ?").get(id) as
			| DbEvent
			| undefined

		if (!event) {
			return res.status(404).json({
				success: false,
				message: "Event med detta ID hittades inte.",
			})
		}

		// Kontrollera att användaren är autentiserad
		const userId = req.user?.id
		if (!userId) {
			return res.status(401).json({
				success: false,
				message: "Oauktoriserad användare.",
			})
		}

		// Kontrollera att användaren är registrerad för eventet
		const registration = db
			.prepare(
				"SELECT * FROM event_registrations WHERE event_id = ? AND user_id = ?"
			)
			.get(id, String(userId)) as
			| {
					id: number
					event_id: string
					user_id: string
					created_at: string
			  }
			| undefined

		if (!registration) {
			return res.status(403).json({
				success: false,
				message: "Du är inte registrerad för detta event.",
			})
		}

		// Skapa chatmeddelandet
		const chatMessageId = crypto.randomUUID()
		const created_at = new Date().toISOString()

		const insertMessage = db.prepare(`
			INSERT INTO chat_messages (id, event_id, user_id, message, created_at)
			VALUES (?, ?, ?, ?, ?)
		`)

		const result = insertMessage.run(
			chatMessageId,
			id,
			String(userId),
			message.trim(),
			created_at
		)

		if (result.changes > 0) {
			// Hämta det skapade meddelandet
			const newMessage = db
				.prepare("SELECT * FROM chat_messages WHERE id = ?")
				.get(chatMessageId) as DbChatMessage

			res.status(201).json({
				success: true,
				message: "Meddelande skapat framgångsrikt.",
				chatMessage: newMessage,
			})
		} else {
			res.status(500).json({
				success: false,
				message: "Misslyckades att skapa meddelandet.",
			})
		}
	} catch (error) {
		console.error("Fel vid skapande av chatmeddelande:", error)
		res.status(500).json({
			success: false,
			message: "Internt serverfel vid skapande av chatmeddelande.",
		})
	}
})
export default router
