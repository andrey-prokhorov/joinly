import { type Response, Router } from "express";
import db from "../db/database-events.js";
import { type AuthRequest, authenticateToken } from "../middleware/auth.js";

const router = Router();

// Typ för Event från databasen
interface DbEvent {
	id: string;
	description: string;
	category: string;
	starts_at: string;
	ends_at: string;
	city: string;
	city_district: string;
	created_at: string;
}

// GET /api/events - hämta alla events
router.get("/", authenticateToken, (_req: AuthRequest, res: Response) => {
	try {
		const events = db
			.prepare("SELECT * FROM events ORDER BY starts_at ASC")
			.all() as DbEvent[];

		res.json({
			success: true,
			events,
			count: events.length,
		});
	} catch (error) {
		console.error("Fel vid hämtning av events:", error);
		res.status(500).json({
			success: false,
			message: "Internt serverfel vid hämtning av events.",
		});
	}
});

// GET /api/events/:id - hämta event med specifikt id
router.get("/:id", authenticateToken, (req: AuthRequest, res: Response) => {
	const { id } = req.params;

	if (!id) {
		return res.status(400).json({
			success: false,
			message: "Event ID krävs.",
		});
	}

	try {
		const event = db.prepare("SELECT * FROM events WHERE id = ?").get(id) as
			| DbEvent
			| undefined;

		if (!event) {
			return res.status(404).json({
				success: false,
				message: "Event med detta ID hittades inte.",
			});
		}

		res.json({
			success: true,
			event,
		});
	} catch (error) {
		console.error("Fel vid hämtning av event:", error);
		res.status(500).json({
			success: false,
			message: "Internt serverfel vid hämtning av event.",
		});
	}
});

// GET /api/events/filter - hämta events med filter
router.get(
	"/filter/search",
	authenticateToken,
	(req: AuthRequest, res: Response) => {
		const { city, category, date_from, date_to } = req.query;

		try {
			let query = "SELECT * FROM events WHERE 1=1";
			const params: any[] = [];

			// Filter för stad
			if (city && typeof city === "string") {
				query += " AND LOWER(city) = LOWER(?)";
				params.push(city);
			}

			// Filter för kategori
			if (category && typeof category === "string") {
				query += " AND LOWER(category) = LOWER(?)";
				params.push(category);
			}

			// Filter för datum från
			if (date_from && typeof date_from === "string") {
				query += " AND starts_at >= ?";
				params.push(date_from);
			}

			// Filter för datum till
			if (date_to && typeof date_to === "string") {
				query += " AND ends_at <= ?";
				params.push(date_to);
			}

			query += " ORDER BY starts_at ASC";

			const events = db.prepare(query).all(params) as DbEvent[];

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
			});
		} catch (error) {
			console.error("Fel vid filtrering av events:", error);
			res.status(500).json({
				success: false,
				message: "Internt serverfel vid filtrering av events.",
			});
		}
	},
);

export default router;
