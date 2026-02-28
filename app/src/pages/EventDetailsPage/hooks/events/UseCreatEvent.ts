import { apiService } from "@/api"
import type { EventFormData } from "@/types/event"

type CreateEvent = {
	title: string
	description: string
	category: string
	start_time: Date
	end_time: Date
	city: string
	city_district: string
}

type CreateEventResult = {
	success: boolean
	message: string
	event?: EventFormData
}

export async function createEvent(event: EventFormData): Promise<CreateEventResult> {
	if (
		event.title === "" ||
		event.description === "" ||
		event.category === "" ||
		event.start_time === "" ||
		event.end_time === "" ||
		event.city === "" ||
		event.city_district === ""
	) {
		return { success: false, message: "Obligatoriska fält är tomma" }
	}

	const newEvent: CreateEvent = {
		title: event.title,
		description: event.description,
		category: event.category,
		start_time: event.start_time,
		end_time: event.end_time,
		city: event.city,
		city_district: event.city_district,
	}

	try {
		const res = await apiService.createEvent(newEvent)

		if (!res.ok) {
			try {
				const errorData = await res.json()
				return {
					success: false,
					message: `Create event failed (${res.status}): ${errorData.message || JSON.stringify(errorData)}`,
				}
			} catch {
				let fallbackMessage = "Unknown error"
				const text = await res.text()
				if (text) {
					fallbackMessage = text
				}

				return {
					success: false,
					message: `Create event failed (${res.status}): ${fallbackMessage}`,
				}
			}
		}

		const data = await res.json()	

		if (!data?.event) {
			return { success: false, message: "Invalid response format" };
		}

		const raw = data.event;
		const createdEvent: EventFormData = {
			id: raw.id,
			creator_user_id: raw.creator_user_id,
			title: raw.title,
			description: raw.description,
			category: raw.category,
			start_time: new Date(raw.start_time),
			end_time: new Date(raw.end_time),
			city: raw.city,
			city_district: raw.city_district,
			created_at: new Date(raw.created_at),
		}

		return { success: true, message: "Event skapades!", event: createdEvent }
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Unknown error"
		return { success: false, message }
	}
}
