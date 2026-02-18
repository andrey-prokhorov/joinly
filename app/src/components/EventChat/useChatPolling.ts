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
        let intervalId: number;

        async function fetchMessages() {
            try {
                const data = await apiService.getEventChatMessages(eventId).then(res => res.json());
                setMessages(Array.isArray(data.messages) ? data.messages : []);
            } catch (err) {
                console.error("Error fetching chat messages", err);
                setMessages([]);
            }
        }

        fetchMessages();
        intervalId = window.setInterval(fetchMessages, intervalMs);

        return () => clearInterval(intervalId);
    }, [eventId, intervalMs]);

    return messages;
}