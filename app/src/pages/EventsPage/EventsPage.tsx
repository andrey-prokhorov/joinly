import { List, ListItem, ListItemButton, ListItemText, Typography } from "@mui/material"
import { useEffect, useState } from "react"
import { apiService } from "@/api"
import { InfoBox } from "@/components/InfoBox/InfoBox"
import { PageLayout } from "../../components/PageLayout/PageLayout"

interface Event {
	id: string
	title: string
	city: string
	city_district: string
	category: string
	start_time: string
	end_time: string
	description: string
}

// formattera datum SE:
const formatDate = (dateString: string) => {
	const date = new Date(dateString)
	return date.toLocaleDateString("sv-SE", {
		weekday: "short",
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	})
}

// event längd:
const getDuration = (start: string, end: string) => {
	const diffMs = new Date(end).getTime() - new Date(start).getTime()
	const hours = Math.floor(diffMs / (1000 * 60 * 60))
	const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
	if (hours === 0) return `${minutes} min`
	if (minutes === 0) return `${hours} tim`
	return `${hours} h ${minutes} min`
}

export const EventsPage = () => {
	// logik här för att hämta aktiviteter från backend och visa dem i listan
	const [events, setEvents] = useState<Event[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState("")

	useEffect(() => {
		const fetchEvents = async () => {
			try {
				const response = await apiService.getEvents()
				if (response.ok) {
					const data = await response.json()
					setEvents(data.events) // Anpassa beroende på hur API-respons ser ut
				} else {
					setError("Kunde inte hämta events")
				}
			} catch (_error) {
				setError("Ett fel uppstod vid hämtning av events")
			} finally {
				setLoading(false)
			}
		}

		fetchEvents()
	}, [])

	return (
		// jsx här

		<PageLayout>
			<Typography variant="h4" sx={{ fontWeight: 700, mb: 7 }}>
				List med aktiviteter
			</Typography>
			{/* loading och error */}
			{loading && <Typography>Laddar...</Typography>}
			{error && <Typography color="error">{error}</Typography>}

			<InfoBox sx={{ justifyContent: "left" }}>
				<List aria-label="contacts">
					{events.map((event) => (
						<ListItem key={event.id} disablePadding>
							<ListItemButton>
								<ListItemText
									primary={`${formatDate(event.start_time)} (${getDuration(event.start_time, event.end_time)})`}
									secondary={`${event.title} - ${event.city}, (${event.city_district}), ${event.category}`}
								/>
							</ListItemButton>
						</ListItem>
					))}
				</List>
			</InfoBox>
		</PageLayout>
	)
}
