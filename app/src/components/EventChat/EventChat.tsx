import SendIcon from "@mui/icons-material/Send";
import {
	Box,
	Button,
	Card,
	CardContent,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { apiService } from "@/api";
import { useChatPolling } from "./useChatPolling";

const MAX_CHAT_MESSAGE_LENGTH = 3000; // Max antal tecken i ett meddelande

interface EventChatProps {
	eventId: string;
	userInfoMap: Record<string, { color: string; name: string }>;
}

interface ChatMessage {
	id: string;
	event_id: string;
	user_id: string;
	message: string;
	created_at: string;
}

export function EventChat({ eventId, userInfoMap }: EventChatProps) {
	const [newMessage, setNewMessage] = useState("");
	const polledMessages = useChatPolling(eventId, 5000); // 5000 ms = 5 sek
	const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
	const [currentUserId, setCurrentUserId] = useState<string>("");

	useEffect(() => {
		// Fetch current user ID from API
		async function fetchCurrentUser() {
			try {
				const res = await apiService.getMe();
				if (res.ok) {
					const data = await res.json();
					setCurrentUserId(data.user?.id);
				}
			} catch (_err) {
				setCurrentUserId("");
			}
		}
		fetchCurrentUser();
	}, []);

	// Sync local chatMessages with polled messages (unless user just sent a message)
	useEffect(() => {
		setChatMessages(polledMessages);
	}, [polledMessages]);

	const handleSendMessage = async () => {
		if (newMessage.trim() && currentUserId) {
			if (newMessage.length > MAX_CHAT_MESSAGE_LENGTH) {
				alert(
					`Meddelande får vara max ${MAX_CHAT_MESSAGE_LENGTH} tecken långt.`,
				);
				return;
			}
			const message: ChatMessage = {
				id: Date.now().toString(),
				event_id: eventId,
				user_id: currentUserId,
				message: newMessage,
				created_at: new Date().toISOString(),
			};
			// Optimistically add message
			setChatMessages((prev) => [...prev, message]);
			setNewMessage("");
			try {
				await apiService.sendEventChatMessage(eventId, newMessage);
			} catch (_err) {
				// Optionally: show error, remove message, etc.
				// For now, do nothing (will be corrected by polling)
			}
		}
	};

	return (
		<Box sx={{ flex: 1, minWidth: 0 }}>
			<Stack
				spacing={2}
				sx={{ height: "100%", display: "flex", flexDirection: "column" }}
			>
				<Typography variant="h6" sx={{ fontWeight: 600 }}>
					Chatt
				</Typography>
				{/* Chat Messages Container */}
				<Card
					sx={{
						flex: 1,
						display: "flex",
						flexDirection: "column",
						overflowY: "auto",
						minHeight: "400px",
						maxHeight: "600px",
					}}
				>
					<CardContent
						sx={{
							flex: 1,
							overflowY: "auto",
							display: "flex",
							flexDirection: "column",
						}}
					>
						{chatMessages.length === 0 ? (
							<Typography
								color="text.secondary"
								sx={{ textAlign: "center", py: 4 }}
							>
								Ingen konversation ännu. Var den första att börja chatta!
							</Typography>
						) : (
							<Stack spacing={1.5}>
								{chatMessages.map((msg) => {
									const isCurrentUser = msg.user_id === currentUserId;
									const userInfo = userInfoMap[msg.user_id];
									const userColor = userInfo?.color || "#999";
									const userName = userInfo?.name || "Unknown";
									return (
										<Box
											key={msg.id}
											sx={{
												display: "flex",
												justifyContent: isCurrentUser
													? "flex-end"
													: "flex-start",
											}}
										>
											<Box
												sx={{
													maxWidth: "75%",
													p: 1.5,
													bgcolor: userColor,
													color: "#fff",
													borderRadius: 2,
													wordBreak: "break-word",
												}}
											>
												{!isCurrentUser && (
													<Typography
														variant="caption"
														sx={{
															fontWeight: 600,
															display: "block",
															mb: 0.5,
															opacity: 0.8,
														}}
													>
														{userName}
													</Typography>
												)}
												<Typography variant="body2" sx={{ mb: 0.5 }}>
													{msg.message}
												</Typography>
												<Typography
													variant="caption"
													sx={{
														textAlign: "right",
														display: "block",
														opacity: 0.7,
													}}
												>
													{new Date(msg.created_at).toLocaleTimeString(
														"sv-SE",
														{
															hour: "2-digit",
															minute: "2-digit",
														},
													)}
												</Typography>
											</Box>
										</Box>
									);
								})}
							</Stack>
						)}
					</CardContent>
				</Card>

				{/* Message Input */}
				<Stack direction="row" spacing={1}>
					<TextField
						fullWidth
						size="small"
						placeholder="Skriv ett meddelande..."
						value={newMessage}
						onChange={(e) => setNewMessage(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								handleSendMessage();
							}
						}}
						slotProps={{ htmlInput: { "aria-label": "Skriv ett meddelande" } }}
					/>
					<Button
						variant="contained"
						endIcon={<SendIcon />}
						onClick={handleSendMessage}
						sx={{ px: 3 }}
					>
						Skicka
					</Button>
				</Stack>
			</Stack>
		</Box>
	);
}
