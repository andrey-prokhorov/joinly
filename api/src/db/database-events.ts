// Events database - använder den delade anslutningen

import type { Database as DatabaseType } from "better-sqlite3"
import { v4 as uuidv4 } from "uuid"

// Funktion för att skapa events-tabell
export function createEventsTable(db: DatabaseType): void {
	db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
	  title TEXT NOT NULL, 
      description TEXT NOT NULL,                   
      category TEXT NOT NULL,
      start_time DATETIME NOT NULL,                 
      end_time DATETIME NOT NULL,
      city TEXT NOT NULL,
      city_district TEXT,
      creator_user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      CHECK (julianday(start_time) < julianday(end_time))
    )
  `)
	console.log("Events table created/verified")
}

// Funktion för att seed:a eventdata
export function seedEvents(db: DatabaseType): void {
	const eventCount = db
		.prepare("SELECT COUNT(*) as count FROM events")
		.get() as {
		count: number
	}

	if (eventCount.count > 0) {
		console.log("Events table already has data, skipping seed")
		return
	}

	// Generate dates for the coming week
	const currentDate = new Date()
	const tomorrow = new Date(currentDate)
	tomorrow.setDate(currentDate.getDate() + 1)

	const generateEventTimes = (
		daysFromNow: number,
		hour: number,
		minute = 0,
		durationHours: number
	) => {
		const date = new Date(currentDate)
		date.setDate(currentDate.getDate() + daysFromNow)
		date.setHours(hour, minute, 0, 0)
		const startTime = date.toISOString().slice(0, 19)

		const endDate = new Date(date.getTime() + durationHours * 60 * 60 * 1000)
		const endTime = endDate.toISOString().slice(0, 19)

		return { startTime, endTime }
	}

	const events = [
		{
			title: "Högdalen Running Club Event",
			category: "Running",
			...(() => {
				const times = generateEventTimes(1, 9, 0, 1)
				return { start_time: times.startTime, end_time: times.endTime }
			})(),
			city: "Stockholm",
			city_district: "Högdalen",
			description:
				"Join us for a day of running and fun in Högdalen! Whether you're a seasoned runner or just looking to get active, this event is for everyone. We'll have various running routes, from beginner-friendly to more challenging ones. Don't forget to bring your running shoes and a water bottle!",
			creator_user_id: "seed-user-id",
		},
		{
			title: "Morning 5K Run",
			category: "Running",
			...(() => {
				const times = generateEventTimes(1, 7, 0, 1.5)
				return { start_time: times.startTime, end_time: times.endTime }
			})(),
			city: "Denver",
			city_district: "Downtown",
			description:
				"Weekly community 5K run through downtown park trails. Perfect for beginners and casual runners.",
			creator_user_id: "seed-user-id",
		},
		{
			title: "10K City Challenge",
			category: "Running",
			...(() => {
				const times = generateEventTimes(2, 8, 0, 2)
				return { start_time: times.startTime, end_time: times.endTime }
			})(),
			city: "Chicago",
			city_district: "Loop",
			description:
				"Fast-paced 10K run through urban streets with water stations and timing chips provided.",
			creator_user_id: "seed-user-id",
		},
		{
			title: "Trail Half Marathon",
			category: "Running",
			...(() => {
				const times = generateEventTimes(3, 7, 30, 3.5)
				return { start_time: times.startTime, end_time: times.endTime }
			})(),
			city: "Portland",
			city_district: "Forest Park",
			description:
				"Challenging 13.1-mile trail run through forest paths with elevation changes and scenic views.",
			creator_user_id: "seed-user-id",
		},
		{
			title: "Sunset 5K Beach Run",
			category: "Running",
			...(() => {
				const times = generateEventTimes(4, 19, 0, 1.5)
				return { start_time: times.startTime, end_time: times.endTime }
			})(),
			city: "San Diego",
			city_district: "Mission Beach",
			description:
				"Evening beach run along the coastline. Soft sand training with beautiful sunset views.",
			creator_user_id: "seed-user-id",
		},
		{
			title: "Marathon Training Group",
			category: "Running",
			...(() => {
				const times = generateEventTimes(5, 6, 0, 4)
				return { start_time: times.startTime, end_time: times.endTime }
			})(),
			city: "Boston",
			city_district: "Back Bay",
			description:
				"20-mile long run training session for marathon preparation. Support vehicle included.",
			creator_user_id: "seed-user-id",
		},
		{
			title: "Urban Cycling Tour",
			category: "Cycling",
			...(() => {
				const times = generateEventTimes(6, 9, 0, 4)
				return { start_time: times.startTime, end_time: times.endTime }
			})(),
			city: "Austin",
			city_district: "Downtown",
			description:
				"25-mile guided bike tour exploring city landmarks and hidden cycling routes.",
			creator_user_id: "seed-user-id",
		},
		{
			title: "15K Hill Training Run",
			category: "Running",
			...(() => {
				const times = generateEventTimes(6, 7, 0, 2.5)
				return { start_time: times.startTime, end_time: times.endTime }
			})(),
			city: "Seattle",
			city_district: "Capitol Hill",
			description:
				"Intermediate distance run focusing on hill repeats and endurance building.",
			creator_user_id: "seed-user-id",
		},
		{
			title: "Mountain Bike Adventure",
			category: "Cycling",
			...(() => {
				const times = generateEventTimes(7, 8, 0, 8)
				return { start_time: times.startTime, end_time: times.endTime }
			})(),
			city: "Moab",
			city_district: "Arches National Park",
			description:
				"Full-day mountain biking on intermediate trails through national forest paths.",
			creator_user_id: "seed-user-id",
		},
		{
			title: "Sprint Triathlon Training",
			category: "Triathlon",
			...(() => {
				const times = generateEventTimes(7, 7, 30, 4.5)
				return { start_time: times.startTime, end_time: times.endTime }
			})(),
			city: "Miami",
			city_district: "South Beach",
			description:
				"Beginner-friendly triathlon training covering 750m swim, 20K bike, and 5K run.",
			creator_user_id: "seed-user-id",
		},
		{
			title: "Night 10K City Run",
			category: "Running",
			...(() => {
				const times = generateEventTimes(7, 20, 0, 2)
				return { start_time: times.startTime, end_time: times.endTime }
			})(),
			city: "Nashville",
			city_district: "Music Row",
			description:
				"Evening 10K run through illuminated city streets with reflective gear provided.",
			creator_user_id: "seed-user-id",
		},
	]

	const insertStmt = db.prepare(`
		INSERT INTO events (id, title, category, start_time, end_time, city, city_district, description, creator_user_id)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`)

	for (const event of events) {
		const id = uuidv4()
		insertStmt.run(
			id,
			event.title,
			event.category,
			event.start_time,
			event.end_time,
			event.city,
			event.city_district,
			event.description,
			event.creator_user_id
		)
	}

	console.log(`Seed: ${events.length} events created`)
}
