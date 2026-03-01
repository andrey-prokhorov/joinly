import {
	Avatar,
	Box,
	List,
	ListItem,
	ListItemText,
	Stack,
	Typography,
} from "@mui/material";
import { InfoBox } from "@/components/InfoBox/InfoBox";
import { generateRandomChatColor } from "./utils";

interface EventUser {
	id: string;
	name: string;
	email: string;
}

interface EventParticipantsProps {
	participants: EventUser[];
	userInfoMap: Record<string, { color: string; name: string }>;
}

export const EventParticipants = ({
	participants,
	userInfoMap,
}: EventParticipantsProps) => {
	return (
		<Box>
			<InfoBox mt={16}>
				<Stack>
					<Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
						Deltagare ({participants.length})
					</Typography>

					<List>
						{participants.map((participant) => {
							const userInfo = userInfoMap[participant.id];
							return (
								<ListItem key={participant.id}>
									<Avatar
										sx={{
											mr: 2,
											bgcolor: userInfo?.color || generateRandomChatColor(),
											color: "surface.secondary",
											fontWeight: "bold",
										}}
									>
										{participant.name.charAt(0)}
									</Avatar>
									<ListItemText
										primary={participant.name}
										secondary={participant.email}
									/>
								</ListItem>
							);
						})}
					</List>
				</Stack>
			</InfoBox>
		</Box>
	);
};
