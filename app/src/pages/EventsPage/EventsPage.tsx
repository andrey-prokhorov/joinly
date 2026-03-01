import {
	Alert,
	Button,
	List,
	ListItem,
	ListItemButton,
	ListItemText,
	Snackbar,
	Stack,
	Typography,
} from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { apiService } from "@/api";
import { InfoBox } from "@/components/InfoBox/InfoBox";
import { createEvent } from "@/pages/EventDetailsPage/hooks/events/UseCreatEvent";
import { CreateEventDialog } from "@/pages/EventsPage/CreateEventDialog";
import { PageLayout } from "../../components/PageLayout/PageLayout";

interface Event {
	id: string;
	title: string;
	city: string;
	city_district: string | null;
	category: string;
	start_time: string;
	end_time: string;
	description: string;
}

// formattera datum SE:
const formatDate = (dateString: string) => {
	const date = new Date(dateString);
	return date.toLocaleString("sv-SE", {
		weekday: "short",
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	});
};

// event längd:
const getDuration = (start: string, end: string) => {
	const diffMs = new Date(end).getTime() - new Date(start).getTime();
	const hours = Math.floor(diffMs / (1000 * 60 * 60));
	const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
	if (hours === 0) return `${minutes} min`;
	if (minutes === 0) return `${hours} tim`;
	return `${hours} h ${minutes} min`;
};

export const EventsPage = () => {
	const navigate = useNavigate();
	// logik här för att hämta aktiviteter från backend och visa dem i listan
	const [events, setEvents] = useState<Event[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [open, setOpen] = useState(false);

	const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
	const [snackbarMessage, setSnackbarMessage] = useState<string>("");
	const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
		"success",
	);

	const fetchEvents = useCallback(async () => {
		try {
			const response = await apiService.getEvents();

			if (response.ok) {
				const data = await response.json();
				setEvents(data.events);
			} else if (response.status === 403) {
				setError("Du saknar behörighet att visa events");
			} else {
				setError("Kunde inte hämta events");
			}
		} catch {
			setError("Ett fel uppstod vid hämtning av events");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchEvents();
	}, [fetchEvents]);

	return (
		<PageLayout>
			<Stack
				direction="row"
				alignItems="center"
				justifyContent="space-between"
				sx={{ mb: 7 }}
			>
				<Typography variant="h4" sx={{ fontWeight: 700, mb: 7 }}>
					List med aktiviteter
				</Typography>

				<Button variant="contained" onClick={() => setOpen(true)}>
					Skapa aktivitet
				</Button>
			</Stack>

			{loading && (
				<Typography role="status" aria-live="polite">
					Laddar...
				</Typography>
			)}

			{error && <Typography color="error">{error}</Typography>}

			<InfoBox sx={{ justifyContent: "left" }}>
				{!loading && !error && events.length === 0 ? (
					<Typography>Inga aktiviteter tillgängliga</Typography>
				) : (
					<List aria-label="aktiviteter">
						{events.map((event) => (
							<ListItem key={event.id} disablePadding>
								<ListItemButton
									onClick={() => navigate({ to: `/events-detail/${event.id}` })}
								>
									<ListItemText
										primary={`${formatDate(event.start_time)} (${getDuration(event.start_time, event.end_time)})`}
										secondary={`${event.title} - ${event.city}${event.city_district ? `, (${event.city_district})` : ""}, ${event.category}`}
									/>
								</ListItemButton>
							</ListItem>
						))}
					</List>
				)}
			</InfoBox>
			<CreateEventDialog
				open={open}
				onClose={() => setOpen(false)}
				onCreate={async (data) => {
					const result = await createEvent(data);

					if (result.success) {
						setSnackbarSeverity("success");
						setSnackbarMessage(result.message);
						setSnackbarOpen(true);

						setOpen(false);
						await fetchEvents();
					} else {
						setSnackbarSeverity("error");
						setSnackbarMessage(result.message);
						setSnackbarOpen(true);
					}
				}}
			/>

			<Snackbar
				open={snackbarOpen}
				autoHideDuration={5000}
				onClose={() => setSnackbarOpen(false)}
			>
				<Alert
					severity={snackbarSeverity}
					variant="filled"
					sx={{ width: "100%" }}
					onClose={() => setSnackbarOpen(false)}
				>
					{snackbarMessage}
				</Alert>
			</Snackbar>
		</PageLayout>
	);
};
