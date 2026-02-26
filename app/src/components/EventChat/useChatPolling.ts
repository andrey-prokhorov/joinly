import { useEffect, useState } from "react";
import { apiService } from "@/api";

interface ChatMessage {
  id: string;
  event_id: string;
  user_id: string;
  message: string;
  created_at: string;
}

export function useChatPolling(eventId: string, intervalMs = 5000) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    useEffect(() => {
        let intervalId: number | null = null;

        async function fetchMessages() {
            try {
                const res = await apiService.getEventChatMessages(eventId);
                if (!res.ok) {
                    // Optionally: show user feedback for specific errors
                    if (res.status === 403) {
                        console.warn("Du är inte längre registrerad för eventet.");
                    } else if (res.status === 404) {
                        console.warn("Eventet hittades inte eller har tagits bort.");
                    } else {
                        console.error(`Fel vid hämtning av chatmeddelanden: ${res.status}`);
                    }
                    setMessages([]);
                    return;
                }
                const data = await res.json();
                setMessages(Array.isArray(data.messages) ? data.messages : []);
            } catch (err) {
                console.error("Error fetching chat messages", err);
                setMessages([]);
            }
        }

        function startPolling() {
            if (intervalId === null) {
                fetchMessages();
                intervalId = window.setInterval(fetchMessages, intervalMs);
            }
        }

        function stopPolling() {
            if (intervalId !== null) {
                clearInterval(intervalId);
                intervalId = null;
            }
        }

        function handleVisibilityChange() {
            if (!document.hidden) {
                startPolling();
            } else {
                stopPolling();
            }
        }

        document.addEventListener("visibilitychange", handleVisibilityChange);
        // Start polling if visible on mount
        if (!document.hidden) {
            startPolling();
        }

        return () => {
            stopPolling();
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [eventId, intervalMs]);

    return messages;
}