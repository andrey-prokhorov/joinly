import { useState } from "react";
import { apiService } from "@/api";

interface UseEventActionsResult {
	actionLoading: boolean;
	joinEvent: (eventId: string) => Promise<boolean>;
	leaveEvent: (eventId: string) => Promise<boolean>;
}

/**
 * Custom hook for handling event registration actions
 * @returns Object with action loading state and join/leave functions
 */
export function useEventActions(): UseEventActionsResult {
	const [actionLoading, setActionLoading] = useState(false);

	const joinEvent = async (eventId: string): Promise<boolean> => {
		try {
			setActionLoading(true);
			const response = await apiService.registerForEvent(eventId);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				console.error(
					"Fel vid registrering:",
					errorData.message || "Okänt fel",
				);
				// TODO: Show error message to user (toast/snackbar)
				return false;
			}

			// TODO: Show success message to user
			return true;
		} catch (error) {
			console.error("Fel vid registrering:", error);
			// TODO: Show error message to user
			return false;
		} finally {
			setActionLoading(false);
		}
	};

	const leaveEvent = async (eventId: string): Promise<boolean> => {
		try {
			setActionLoading(true);
			const response = await apiService.unregisterFromEvent(eventId);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				console.error(
					"Fel vid avregistrering:",
					errorData.message || "Okänt fel",
				);
				// TODO: Show error message to user (toast/snackbar)
				return false;
			}

			// TODO: Show success message to user
			return true;
		} catch (error) {
			console.error("Fel vid avregistrering:", error);
			// TODO: Show error message to user
			return false;
		} finally {
			setActionLoading(false);
		}
	};

	return {
		actionLoading,
		joinEvent,
		leaveEvent,
	};
}
