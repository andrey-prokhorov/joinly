import { Box, Chip, Divider, Stack, Typography } from "@mui/material";
import { InfoBox } from "@/components/InfoBox/InfoBox";

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

interface EventInfoProps {
	event: Event;
}

// formattera datum SE:
const formatDate = (dateString: string) => {
	const date = new Date(dateString);
	return date.toLocaleString("sv-SE", {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
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

export const EventInfo = ({ event }: EventInfoProps) => {
	return (
		<>
			{/* Event Header */}
			<Box>
				<Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
					{event.title}
				</Typography>
				<Stack direction="row" spacing={1} sx={{ mb: 2 }}>
					<Chip label={event.category} color="primary" variant="outlined" />
					<Chip
						label={`${event.city}${event.city_district ? `, ${event.city_district}` : ""}`}
						variant="outlined"
					/>
				</Stack>
			</Box>

			{/* Event Information */}
			<InfoBox>
				<Stack spacing={2}>
					<Box>
						<Typography
							variant="subtitle2"
							sx={{ fontWeight: 600, color: "text.secondary" }}
						>
							Starttid
						</Typography>
						<Typography variant="body1">
							{formatDate(event.start_time)}
						</Typography>
					</Box>

					<Divider />

					<Box>
						<Typography
							variant="subtitle2"
							sx={{ fontWeight: 600, color: "text.secondary" }}
						>
							Sluttid
						</Typography>
						<Typography variant="body1">
							{formatDate(event.end_time)}
						</Typography>
					</Box>

					<Divider />

					<Box>
						<Typography
							variant="subtitle2"
							sx={{ fontWeight: 600, color: "text.secondary" }}
						>
							Varaktighet
						</Typography>
						<Typography variant="body1">
							{getDuration(event.start_time, event.end_time)}
						</Typography>
					</Box>

					<Divider />

					<Box>
						<Typography
							variant="subtitle2"
							sx={{ fontWeight: 600, color: "text.secondary" }}
						>
							Beskrivning
						</Typography>
						<Typography variant="body1">{event.description}</Typography>
					</Box>
				</Stack>
			</InfoBox>
		</>
	);
};
