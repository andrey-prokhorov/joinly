import { AppBar, Box, Stack, Toolbar, Typography, Button } from "@mui/material"
import { Logo } from "../Logo/Logo"
import { MenuButton } from "./MenuButton"
import { useAuth } from "../../useAuth"

export const TopMenu = () => {
    const { user, isAuthenticated, logout } = useAuth()

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
                        </Stack>
                    </Box>
                    {isAuthenticated && user ? (
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Typography variant="body2" sx={{ color: "primary.main" }}>
                                Inloggad som: <strong>{user.name}</strong>
                            </Typography>
                            <Button
                                onClick={() => logout()}
                                sx={{
                                    color: "black",
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
                                Logga ut
                            </Button>
                        </Stack>
                    ) : (
                        <Button
                            href="/login"
                            variant="text"
                            sx={{
                                color: "black",
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
    )
}
