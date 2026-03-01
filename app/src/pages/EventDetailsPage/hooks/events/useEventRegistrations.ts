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
					// User is not registered for this event
					setParticipants([]);
					setIsCurrentUserRegistered(false);
					setError("Du är inte registrerad för detta event");
					return;
				}

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
		} catch (fetchError) {
			console.error("Fel vid hämtning av deltagarlista:", fetchError);
			setError("Ett fel uppstod vid hämtning av deltagarlista");
			setParticipants([]);
			setIsCurrentUserRegistered(false);
		} finally {
			if (isInitialLoad) {
				setLoading(false);
				setIsInitialLoad(false);
			}
		}
	}, [eventId, user, isInitialLoad]);

	const refetch = () => {
		fetchEventRegistrations();
	};

	useEffect(() => {
		fetchEventRegistrations();

		// Set up polling every 5 seconds
		const interval = setInterval(() => {
			fetchEventRegistrations();
		}, 5000);

		// Cleanup interval on component unmount
		return () => clearInterval(interval);
	}, [fetchEventRegistrations]);

	return {
		participants,
		loading,
		error,
		isCurrentUserRegistered,
		refetch,
	};
}
