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

export default router
