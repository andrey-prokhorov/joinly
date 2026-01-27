import { AppBar, Box, Stack, Toolbar, Typography } from "@mui/material"
import { MenuButton } from "./MenuButton"

export const TopMenu = () => {
	return (
		<AppBar position="static">
			<Typography variant="h5" px={4} py={2} sx={{ color: "black.main" }}>
				Joinly
			</Typography>
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
							<MenuButton href="/start">Start</MenuButton>
							<MenuButton href="/events">Events</MenuButton>
						</Stack>
					</Box>
				</Toolbar>
			</AppBar>
		</AppBar>
	)
}
