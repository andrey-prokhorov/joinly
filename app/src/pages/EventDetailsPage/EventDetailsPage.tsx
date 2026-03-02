import { Box, Stack, Typography } from "@mui/material";
import { useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { EventChat } from "@/pages/EventDetailsPage/EventChat/EventChat";
import { PageLayout } from "../../components/PageLayout/PageLayout";
import { EventActionButtons } from "./EventActionButtons";
import { EventInfo } from "./EventInfo";
import { EventParticipants } from "./EventParticipants";
import { useEventDetails, useEventRegistrations } from "./hooks/events";
import { useEventActions } from "./useEventActions";
import { createUserInfoMap } from "./utils";

export const EventDetailsPage = () => {
	const { eventId } = useParams({ from: "/events-detail/$eventId" });

	// Use custom hooks for data fetching
	const {
		event,
		loading: eventLoading,
		error: eventError,
	} = useEventDetails(eventId);
	const {
		participants,
		loading: registrationsLoading,
		error: registrationsError,
		isCurrentUserRegistered,
		refetch: refetchRegistrations,
	} = useEventRegistrations(eventId);

	const { actionLoading, joinEvent, leaveEvent } = useEventActions();

	const [userInfoMap, setUserInfoMap] = useState<
		Record<string, { color: string; name: string }>
	>({});

	// Build user info map for each user (color + name) whenever participants change
	useEffect(() => {
		setUserInfoMap(createUserInfoMap(participants));
	}, [participants]);

	const loading = eventLoading || registrationsLoading;
	const error = eventError || registrationsError;

	const handleJoinEvent = async () => {
		const success = await joinEvent(eventId);
		if (success) {
			refetchRegistrations();
		}
	};

	const handleLeaveEvent = async () => {
		const success = await leaveEvent(eventId);
		if (success) {
			refetchRegistrations();
		}
	};

	if (loading) {
		return (
			<PageLayout>
				<Typography>Laddar eventdetaljer...</Typography>
			</PageLayout>
		);
	}

	if (error || !event) {
		return (
			<PageLayout>
				<Typography color="error">{error || "Event hittades inte"}</Typography>
			</PageLayout>
		);
	}

	return (
		<PageLayout>
			<Stack
				direction={{ xs: "column", md: "row" }}
				spacing={3}
				sx={{
					mb: 4,
				}}
			>
				<Box sx={{ flex: 1, minWidth: 0 }}>
					<Stack spacing={3}>
						<EventInfo event={event} />

						<EventActionButtons
							isCurrentUserRegistered={isCurrentUserRegistered}
							onJoinEvent={handleJoinEvent}
							onLeaveEvent={handleLeaveEvent}
							loading={actionLoading}
						/>

						{isCurrentUserRegistered && (
							<EventChat eventId={eventId} userInfoMap={userInfoMap} />
						)}
					</Stack>
				</Box>

				<EventParticipants
					participants={participants}
					userInfoMap={userInfoMap}
				/>
			</Stack>
		</PageLayout>
	);
};
