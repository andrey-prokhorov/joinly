import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { AppBar, Box, Button, Stack, Toolbar, Typography } from "@mui/material";
import { Link } from "@tanstack/react-router";
import { useAuth } from "../../useAuth";
import { Logo } from "../Logo/Logo";
import { MenuButton } from "./MenuButton";

export const TopMenu = () => {
	const { user, isAuthenticated, logout } = useAuth();

	return (
		<AppBar position="static">
			<Stack direction="row" alignItems="center" px={4} py={1} spacing={1}>
				<Logo />
				<Typography variant="h5" px={4} py={2}>
					joinly
				</Typography>
			</Stack>
			<AppBar
				position="static"
				sx={{
					bgcolor: "secondary.light",
					borderTop: "1px solid",
					borderColor: "primary.main",
					padding: 0,
				}}
			>
				<Toolbar sx={{ padding: 0, px: 2, minHeight: 56 }}>
					<Box sx={{ flexGrow: 1 }}>
						<Stack direction="row" alignItems="center">
							<MenuButton to="/start">Start</MenuButton>
							<MenuButton to="/events">Events</MenuButton>
							<MenuButton to="/my-events">Mina Events</MenuButton>
						</Stack>
					</Box>
					{isAuthenticated && user ? (
						<Stack direction="row" alignItems="center" spacing={2}>
							<PersonOutlineOutlinedIcon sx={{ color: "primary.main" }} />

							<Typography
								variant="body1"
								sx={{ color: "primary.main", fontWeight: 600 }}
							>
								{user.name}
							</Typography>

							<Button
								onClick={() => logout()}
								variant="outlined"
								size="small"
								sx={{
									color: "primary.main",
									fontWeight: 600,
									textTransform: "none",
								}}
							>
								Logga ut
							</Button>
						</Stack>
					) : (
						<Button
							component={Link}
							to="/login"
							variant="text"
							sx={{
								color: "primary.main",
								fontWeight: 600,
								textTransform: "none",
								fontSize: "1rem",
								px: 2,
								py: 1,
								"&:hover": {
									bgcolor: "rgba(9, 99, 126, 0.15)",
									textDecoration: "underline",
								},
							}}
						>
							Logga in
						</Button>
					)}
				</Toolbar>
			</AppBar>
		</AppBar>
	);
};
