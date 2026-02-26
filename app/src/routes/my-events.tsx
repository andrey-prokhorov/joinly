import { createFileRoute, redirect } from "@tanstack/react-router"
import { apiService } from "@/api"
import { MyEventsPage } from "@/pages/MyEventsPage/MyEventsPage"

const MyEvents = () => {
	return <MyEventsPage />
}

export const Route = createFileRoute("/my-events")({
	beforeLoad: () => {
		if (!apiService.hasToken()) {
			throw redirect({ to: "/login" })
		}
	},
	component: MyEvents,
})
