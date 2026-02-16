import { createFileRoute, redirect } from "@tanstack/react-router"
import { EventsPage } from "@/pages/EventsPage/EventsPage"

const Events = () => {
	return <EventsPage />
}

export const Route = createFileRoute("/events")({
	beforeLoad: () => {
		const token = localStorage.getItem("authToken")
		if (!token) {
			throw redirect({ to: "/login" })
		}
	},
	component: Events,
})
