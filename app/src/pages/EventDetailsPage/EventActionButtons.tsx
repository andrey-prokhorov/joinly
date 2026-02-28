import { Button, Stack } from "@mui/material";

interface EventActionButtonsProps {
	isCurrentUserRegistered: boolean;
	onJoinEvent: () => void;
	onLeaveEvent: () => void;
	loading?: boolean;
}

export const EventActionButtons = ({
	isCurrentUserRegistered,
	onJoinEvent,
	onLeaveEvent,
	loading = false,
}: EventActionButtonsProps) => {
	return (
		<Stack direction="row" spacing={2}>
			{isCurrentUserRegistered ? (
				<Button
					variant="outlined"
					color="error"
					fullWidth
					onClick={onLeaveEvent}
					disabled={loading}
				>
					Lämna event
				</Button>
			) : (
				<Button
					variant="contained"
					color="primary"
					fullWidth
					onClick={onJoinEvent}
					disabled={loading}
				>
					Anmäl mig
				</Button>
			)}
		</Stack>
	);
};
