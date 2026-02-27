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

/**
 * @openapi
 * /api/myevents:
 *   get:
 *     summary: Hämta mina events (de jag är registrerad på)
 *     description: Returnerar alla events som den autentiserade användaren är registrerad på.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lyckad hämtning av användarens events
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
 *                   type: integer
 *                   example: 2
 *       401:
 *         description: Oauktoriserad användare
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Oauktoriserad användare.
 *       500:
 *         description: Internt serverfel vid hämtning av användarens events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internt serverfel vid hämtning av användarens events.
 */
// GET /api/myevents - hämta mina events (de jag är registrerad på)
router.get("/", (req: AuthRequest, res: Response) => {
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
 * /api/myevents/created:
 *   get:
 *     summary: Hämta mina skapade events
 *     description: Returnerar alla events som den autentiserade användaren har skapat.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lyckad hämtning av användarens skapade events
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
 *                   type: integer
 *                   example: 3
 *       401:
 *         description: Oauktoriserad användare
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Oauktoriserad användare.
 *       500:
 *         description: Internt serverfel vid hämtning av skapade events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internt serverfel vid hämtning av användarens skapade events.
 */
// GET /api/myevents/created - hämta mina skapade events (de jag har skapat)
router.get("/created", (req: AuthRequest, res: Response) => {
	console.log("here")
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
				`SELECT *
				FROM events
				WHERE creator_user_id = ?`
			)
			.all(userId) as DbEvent[]

		console.log(events)

		res.json({
			success: true,
			events,
			count: events.length,
		})
	} catch (error) {
		console.error("Fel vid hämtning av användarens skapade events:", error)
		res.status(500).json({
			success: false,
			message: "Internt serverfel vid hämtning av användarens skapade events.",
		})
	}
})

export default router
