import { createFileRoute, redirect } from "@tanstack/react-router"
import { apiService } from "@/api"
import { EventsPage } from "@/pages/EventsPage/EventsPage"

const Events = () => {
	return <EventsPage />
}

export const Route = createFileRoute("/events")({
	beforeLoad: () => {
		if (!apiService.hasToken()) {
			throw redirect({ to: "/login" })
		}
	},
	component: Events,
})
