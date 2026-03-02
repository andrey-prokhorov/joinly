import { useCallback, useEffect, useState } from "react";
import { apiService } from "@/api";

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

interface UseEventDetailsResult {
	event: Event | null;
	loading: boolean;
	error: string;
	refetch: () => void;
}

export function useEventDetails(eventId: string): UseEventDetailsResult {
	const [event, setEvent] = useState<Event | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const fetchEventDetails = useCallback(async () => {
		if (!eventId) {
			setError("Inget event-ID angivet");
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError("");

			const response = await apiService.getEvent(eventId);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				setError(errorData.message || "Kunde inte hämta eventdetaljer");
				setEvent(null);
				return;
			}

			const data = await response.json();
			const eventData = data?.event;

			if (!eventData) {
				setError("Event hittades inte");
				setEvent(null);
				return;
			}

			setEvent(eventData);
		} catch (fetchError) {
			console.error("Fel vid hämtning av eventdetaljer:", fetchError);
			setError("Ett fel uppstod vid hämtning av eventdetaljer");
			setEvent(null);
		} finally {
			setLoading(false);
		}
	}, [eventId]);

	const refetch = () => {
		fetchEventDetails();
	};

	useEffect(() => {
		fetchEventDetails();
	}, [fetchEventDetails]);

	return {
		event,
		loading,
		error,
		refetch,
	};
}
