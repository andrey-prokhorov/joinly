import { createFileRoute } from "@tanstack/react-router"
import { EventsPage } from "@/pages/EventsPage/EventsPage"

const Events = () => {
	return <EventsPage />
}

export const Route = createFileRoute("/events")({
	component: Events,
})
