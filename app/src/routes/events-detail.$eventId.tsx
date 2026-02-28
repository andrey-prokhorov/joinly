import { createFileRoute, redirect } from "@tanstack/react-router";
import { apiService } from "@/api";
import { EventDetailsPage } from "@/pages/EventDetailsPage/EventDetailsPage";

const EventDetails = () => {
	return <EventDetailsPage />;
};

export const Route = createFileRoute("/events-detail/$eventId")({
	beforeLoad: () => {
		if (!apiService.hasToken()) {
			throw redirect({ to: "/login" });
		}
	},
	component: EventDetails,
});
