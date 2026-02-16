// Event registrations - anmälan/avanmälan till events
// Visas på /api/events i index.ts

import { type Response, Router } from "express"
import db from "../db/database.js"
import type { AuthRequest } from "../middleware/auth.js"

const router = Router()

// Typ från event från db:
interface DbEvent {
	id: string
	end_time: string
}

// Typ för registrering från databasen:
interface DbRegistration {
	id: number
	event_id: string
	user_id: string
	created_at: string
}

// Enkel UUID-validering
const isValidUuid = (id: string): boolean =>
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

/**
 * @openapi
 * /api/events/{eventId}/register:
 *   post:
 *     summary: Register for an event
 *     description: Register the authenticated user for a specific event
 *     tags: [Event Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID (UUID)
 *     responses:
 *       201:
 *         description: Registration successful
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
 *                   example: "Registrering genomförd."
 *                 registration:
 *                   $ref: '#/components/schemas/EventRegistration'
 *       400:
 *         description: Invalid event ID or event has ended
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Event not found
 *       409:
 *         description: Already registered
 */
router.post("/:eventId/register", (req: AuthRequest, res: Response) => {
	const { eventId } = req.params as { eventId: string }
	const userId = req.user?.id

	if (!userId) {
		res.status(401).json({
			success: false,
			message: "Oauktoriserad användare.",
		})
		return
	}

	// Validera UUID-format innan vi frågar databasen
	if (!isValidUuid(eventId)) {
		res.status(400).json({
			success: false,
			message: "Ogiltigt event-ID format.",
		})
		return
	}

	try {
		// Kontrollera att eventet existerar
		const event = db
			.prepare("SELECT id, end_time FROM events WHERE id = ?")
			.get(eventId) as DbEvent | undefined

		if (!event) {
			res.status(404).json({
				success: false,
				message: "Event med detta ID hittades inte.",
			})
			return
		}

		// Kontrollera att eventet inte har avslutats
		if (new Date(event.end_time) < new Date()) {
			res.status(400).json({
				success: false,
				message: "Eventet har redan avslutats.",
			})
			return
		}

		// Kontrollera att användaren inte redan är registrerad
		const existing = db
			.prepare(
				"SELECT id FROM event_registrations WHERE event_id = ? AND user_id = ?"
			)
			.get(eventId, userId)

		if (existing) {
			res.status(409).json({
				success: false,
				message: "Du är redan registrerad för detta event.",
			})
			return
		}

		// Registrera användaren
		let result: ReturnType<ReturnType<typeof db.prepare>["run"]>
		try {
			result = db
				.prepare(
					"INSERT INTO event_registrations (event_id, user_id) VALUES (?, ?)"
				)
				.run(eventId, userId)
		} catch (err) {
			const sqliteError = err as { code?: string; message?: string }
			const isUniqueConstraint =
				sqliteError?.code === "SQLITE_CONSTRAINT_UNIQUE" ||
				(sqliteError?.message ?? "").includes("UNIQUE constraint failed")

			if (isUniqueConstraint) {
				res.status(409).json({
					success: false,
					message: "Du är redan registrerad för detta event.",
				})
				return
			}

			throw err
		}
		const registration = db
			.prepare("SELECT * FROM event_registrations WHERE id = ?")
			.get(result.lastInsertRowid) as DbRegistration | undefined

		if (!registration) {
			res.status(500).json({
				success: false,
				message: "Registrering skapades men kunde inte hämtas.",
			})
			return
		}

		res.status(201).json({
			success: true,
			message: "Registrering genomförd.",
			registration,
		})
	} catch (error) {
		console.error("Fel vid registrering:", error)
		res.status(500).json({
			success: false,
			message: "Internt serverfel vid registrering.",
		})
	}
})

/**
 * @openapi
 * /api/events/{eventId}/register:
 *   delete:
 *     summary: Unregister from an event
 *     description: Unregister the authenticated user from a specific event
 *     tags: [Event Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID (UUID)
 *     responses:
 *       200:
 *         description: Unregistration successful
 *       400:
 *         description: Invalid event ID
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Event not found or not registered
 */
router.delete("/:eventId/register", (req: AuthRequest, res: Response) => {
	const { eventId } = req.params as { eventId: string }
	const userId = req.user?.id

	if (!userId) {
		res.status(401).json({
			success: false,
			message: "Oauktoriserad användare.",
		})
		return
	}

	if (!isValidUuid(eventId)) {
		res.status(400).json({
			success: false,
			message: "Ogiltigt event-ID format.",
		})
		return
	}

	try {
		// Kontrollera att eventet existerar
		const event = db.prepare("SELECT id FROM events WHERE id = ?").get(eventId)

		if (!event) {
			res.status(404).json({
				success: false,
				message: "Event med detta ID hittades inte.",
			})
			return
		}

		// Ta bort registreringen
		const result = db
			.prepare(
				"DELETE FROM event_registrations WHERE event_id = ? AND user_id = ?"
			)
			.run(eventId, userId)

		// result.changes = 0 betyder att ingen rad togs bort (ej registrerad)
		if (result.changes === 0) {
			res.status(404).json({
				success: false,
				message: "Du är inte registrerad för detta event.",
			})
			return
		}

		res.json({
			success: true,
			message: "Avregistrering genomförd.",
		})
	} catch (error) {
		console.error("Fel vid avregistrering:", error)
		res.status(500).json({
			success: false,
			message: "Internt serverfel vid avregistrering.",
		})
	}
})

export default router
