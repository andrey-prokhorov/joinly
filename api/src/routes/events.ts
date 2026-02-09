import { type Response, Router } from "express"
import db from "../db/database.js"
import { type AuthRequest, authenticateToken } from "../middleware/auth.js"

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
	created_at: string
}

// GET /api/events - hämta alla events
router.get("/", authenticateToken, (_req: AuthRequest, res: Response) => {
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

// GET /api/events/:id - hämta event med specifikt id
router.get("/:id", authenticateToken, (req: AuthRequest, res: Response) => {
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

// GET /api/events/filter - hämta events med filter
router.get(
	"/filter/search",
	authenticateToken,
	(req: AuthRequest, res: Response) => {
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
	}
)

// POST /api/events - skapa nytt event
router.post("/", authenticateToken, (req: AuthRequest, res: Response) => {
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
			INSERT INTO events (id, title, description, category, start_time, end_time, city, city_district, created_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		`)

		const result = insertEvent.run(
			id,
			title,
			description,
			category,
			start_time,
			end_time,
			city,
			city_district,
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

// PUT /api/events/:id - uppdatera event
router.put("/:id", authenticateToken, (req: AuthRequest, res: Response) => {
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

// DELETE /api/events/:id - ta bort event
router.delete("/:id", authenticateToken, (req: AuthRequest, res: Response) => {
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

export default router
