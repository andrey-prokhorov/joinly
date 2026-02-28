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
	const { user } = useAuth();

	const fetchEventRegistrations = useCallback(async () => {
		if (!eventId) {
			setError("Inget event-ID angivet");
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
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

			setParticipants(users);

			// Check if current user is registered
			if (user?.id) {
				const isRegistered = users.some(
					(participant: EventUser) => participant.id === user.id,
				);
				setIsCurrentUserRegistered(isRegistered);
				console.log("Current user registration status:", isRegistered);
			}
		} catch (fetchError) {
			console.error("Fel vid hämtning av deltagarlista:", fetchError);
			setError("Ett fel uppstod vid hämtning av deltagarlista");
			setParticipants([]);
			setIsCurrentUserRegistered(false);
		} finally {
			setLoading(false);
		}
	}, [eventId, user]);

	const refetch = () => {
		fetchEventRegistrations();
	};

	useEffect(() => {
		fetchEventRegistrations();
	}, [fetchEventRegistrations]);

	return {
		participants,
		loading,
		error,
		isCurrentUserRegistered,
		refetch,
	};
}
