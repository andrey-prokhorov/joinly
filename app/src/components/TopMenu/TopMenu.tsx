import { AppBar, Box, Stack, Toolbar, Typography } from "@mui/material"
import { Logo } from "../Logo/Logo"
import { MenuButton } from "./MenuButton"

export const TopMenu = () => {
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
				<Toolbar sx={{ padding: 0 }}>
					<Box sx={{ flexGrow: 1 }}>
						<Stack direction="row" alignItems="center">
							<MenuButton to="/start">Start</MenuButton>
							<MenuButton to="/events">Events</MenuButton>
						</Stack>
					</Box>
				</Toolbar>
			</AppBar>
		</AppBar>
	)
}
