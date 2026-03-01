import { useCallback, useEffect, useState } from "react";
import { apiService } from "@/api";
import { useAuth } from "@/useAuth";

interface EventUser {
	id: string;
	name: string;
	email: string;
}

interface UseEventRegistrationsResult {
	participants: EventUser[];
	loading: boolean;
	error: string;
	isCurrentUserRegistered: boolean;
	refetch: () => void;
}

export function useEventRegistrations(
	eventId: string,
): UseEventRegistrationsResult {
	const [participants, setParticipants] = useState<EventUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [isCurrentUserRegistered, setIsCurrentUserRegistered] = useState(false);
	const [isInitialLoad, setIsInitialLoad] = useState(true);
	const [shouldPoll, setShouldPoll] = useState(true);
	const [errorCount, setErrorCount] = useState(0);
	const { user } = useAuth();

	const fetchEventRegistrations = useCallback(async () => {
		if (!eventId) {
			setError("Inget event-ID angivet");
			if (isInitialLoad) {
				setLoading(false);
				setIsInitialLoad(false);
			}
			return;
		}

		try {
			if (isInitialLoad) {
				setLoading(true);
			}
			setError("");

			const response = await apiService.getEventRegistrations(eventId);

			if (!response.ok) {
				if (response.status === 403) {
					// User is not registered for this event - stop polling
					setParticipants([]);
					setIsCurrentUserRegistered(false);
					setError("Du är inte registrerad för detta event");
					setShouldPoll(false);
					return;
				}

				// For other errors, increment error count
				setErrorCount(prev => prev + 1);
				const errorData = await response.json().catch(() => ({}));
				setError(errorData.message || "Kunde inte hämta deltagarlista");
				setParticipants([]);
				setIsCurrentUserRegistered(false);
				return;
			}

			const data = await response.json();
			const users = data.registrations || [];

			// Only update participants if data has actually changed
			setParticipants((prevParticipants) => {
				if (
					prevParticipants.length !== users.length ||
					!prevParticipants.every((p, i) => p.id === users[i]?.id)
				) {
					return users;
				}
				return prevParticipants;
			});

			// Check if current user is registered
			if (user?.id) {
				const isRegistered = users.some(
					(participant: EventUser) => participant.id === user.id,
				);
				setIsCurrentUserRegistered((prev) =>
					prev !== isRegistered ? isRegistered : prev,
				);
			}
			// Reset error count on successful request
			setErrorCount(0);
		} catch (fetchError) {
			console.error("Fel vid hämtning av deltagarlista:", fetchError);
			setError("Ett fel uppstod vid hämtning av deltagarlista");
			setParticipants([]);
			setIsCurrentUserRegistered(false);
			setErrorCount(prev => prev + 1);
		} finally {
			if (isInitialLoad) {
				setLoading(false);
				setIsInitialLoad(false);
			}
		}
	}, [eventId, user, isInitialLoad]);

	const refetch = () => {
		fetchEventRegistrations();
		setShouldPoll(true); // Resume polling on manual refetch
		setErrorCount(0); // Reset error count
	};

	useEffect(() => {
		fetchEventRegistrations();

		// Set up polling with conditions
		const interval = setInterval(() => {
			// Only poll if:
			// 1. Polling is enabled
			// 2. Error count is not too high (stop after 3 consecutive errors)
			// 3. Tab is visible
			if (shouldPoll && errorCount < 3 && !document.hidden) {
				fetchEventRegistrations();
			}
		}, 5000);

		// Cleanup interval on component unmount
		return () => clearInterval(interval);
	}, [fetchEventRegistrations, shouldPoll, errorCount]);
		error,
		isCurrentUserRegistered,
		refetch,
	};
}
