import { List, ListItem, ListItemButton, ListItemText, Typography } from "@mui/material"
import { useEffect, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { apiService } from "@/api"
import { InfoBox } from "@/components/InfoBox/InfoBox"
import { PageLayout } from "../../components/PageLayout/PageLayout"

interface Event {
	id: string
	title: string
	city: string
	city_district: string | null
	category: string
	start_time: string
	end_time: string
	description: string
}

// formattera datum SE:
const formatDate = (dateString: string) => {
	const date = new Date(dateString)
	return date.toLocaleString("sv-SE", {
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

export const MyEventsPage = () => {
	const navigate = useNavigate()
	const [registeredEvents, setRegisteredEvents] = useState<Event[]>([])
	const [createdEvents, setCreatedEvents] = useState<Event[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState("")

	useEffect(() => {
		const fetchRegisteredEvents = async () => {
			try {
				const responseRegisteredEvents = await apiService.getMyEvents()

				if (responseRegisteredEvents.ok) {
					const registeredData = await responseRegisteredEvents.json()
					setRegisteredEvents(registeredData.events)
				} else if (responseRegisteredEvents.status === 403) {
					setError("Du saknar behörighet att visa events")
				} else {
					setError("Kunde inte hämta registrerade events")
				}

				const responseCreatedEvents = await apiService.getMyCreatedEvents()
				if (responseCreatedEvents.ok) {
					const createdData = await responseCreatedEvents.json()
					setCreatedEvents(createdData.events)
				} else if (responseCreatedEvents.status === 403) {
					setError("Du saknar behörighet att visa events")
				} else {
					setError("Kunde inte hämta skapade events")
				}
			} catch (_error) {
				setError("Ett fel uppstod vid hämtning av events")
			} finally {
				setLoading(false)
			}
		}

		fetchRegisteredEvents()
	}, [])

	return (
		<PageLayout>
			<Typography variant="h4" sx={{ fontWeight: 700, mb: 7 }}>
				Mina aktiviteter
			</Typography>
			{/* loading och error */}
			{loading && (
				<Typography role="status" aria-live="polite">
					Laddar...
				</Typography>
			)}
			{error && <Typography color="error">{error}</Typography>}

			<InfoBox sx={{ flexDirection: "column", alignItems: "flex-start" }}>
				{/* SKAPADE */}
				<Typography variant="h6" sx={{ mt: 4, mb: 1, p: "8px 16px" }}>
					Aktiviteter jag skapat
				</Typography>

				{createdEvents.length === 0 ? (
					<Typography>Du har inte skapat några aktiviteter än</Typography>
				) : (
					<List aria-label="aktiviteter jag skapat" sx={{ width: "100%" }}>
						{createdEvents.map((event) => (
							<ListItem key={event.id} disablePadding>
								<ListItemButton onClick={() => navigate({ to: `/events-detail/${event.id}` })}>
									<ListItemText
										primary={`${formatDate(event.start_time)} (${getDuration(event.start_time, event.end_time)})`}
										secondary={`${event.title} - ${event.city}${
											event.city_district ? `, (${event.city_district})` : ""
										}, ${event.category}`}
									/>
								</ListItemButton>
							</ListItem>
						))}
					</List>
				)}
			</InfoBox>
			<InfoBox sx={{ flexDirection: "column", alignItems: "flex-start" }}>
				{/* REGISTRERADE */}
				<Typography variant="h6" sx={{ mt: 4, mb: 1, p: "8px 16px" }}>
					Aktiviteter jag deltar i
				</Typography>

				{!loading && !error && registeredEvents.length === 0 ? (
					<Typography sx={{ mb: 3 }}>Du är inte registrerad på någon aktivitet än</Typography>
				) : (
					<List aria-label="aktiviteter jag skapat" sx={{ width: "100%" }}>
						{registeredEvents.map((event) => (
							<ListItem key={event.id} disablePadding>
								<ListItemButton onClick={() => navigate({ to: `/events-detail/${event.id}` })}>
									<ListItemText
										primary={`${formatDate(event.start_time)} (${getDuration(event.start_time, event.end_time)})`}
										secondary={`${event.title} - ${event.city}${
											event.city_district ? `, (${event.city_district})` : ""
										}, ${event.category}`}
									/>
								</ListItemButton>
							</ListItem>
						))}
					</List>
				)}
			</InfoBox>
		</PageLayout>
	)
}
