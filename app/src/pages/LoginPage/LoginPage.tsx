import { useState } from "react"
import { Stack, TextField, Button, Typography, Box, Link } from "@mui/material"
import { InfoBox } from "../../components/InfoBox/InfoBox"
import { PageLayout } from "../../components/PageLayout/PageLayout"
import { apiService } from "@/api"

export const LoginPage = () => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleLogin = async () => {
        if (!email || !password) {
            setError("Epostadress och lösenord är obligatoriska")
            return
        }

        setIsLoading(true)
        setError("")

        try {
            const response = await apiService.login(email, password)

            if (!response.ok) {
                const data = await response.json()
                setError(data.message || "Inloggningen misslyckades")
                return
            }

            const data = await response.json()
            // Store the JWT token
            apiService.setToken(data.token)
            window.location.href = "/events"
        } catch (err) {
            setError("Ett fel uppstod vid inloggning")
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleLogin()
        }
    }

    return (
        <PageLayout>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 7 }}>
                Logga in
            </Typography>

            <InfoBox>
                <Stack spacing={3} sx={{ width: "100%", maxWidth: 400 }}>
                    <Typography variant="body1" sx={{ textAlign: "center", mb: 2 }}>
                        Logga in på ditt Joinly-konto
                    </Typography>

                    {error && (
                        <Box
                            sx={{
                                p: 2,
                                bgcolor: "error.light",
                                color: "error.main",
                                borderRadius: 1,
                                textAlign: "center",
                            }}
                        >
                            {error}
                        </Box>
                    )}

                    <TextField
                        label="Epost"
                        variant="outlined"
                        fullWidth
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                        placeholder="Ange din epostadress"
                    />

                    <TextField
                        label="Lösenord"
                        type="password"
                        variant="outlined"
                        fullWidth
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                        placeholder="Ange ditt lösenord"
                    />

                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleLogin}
                        disabled={isLoading}
                        sx={{
                            bgcolor: "primary.main",
                            color: "white",
                            py: 1.5,
                            fontSize: "1rem",
                            fontWeight: 600,
                            "&:hover": {
                                bgcolor: "primary.dark",
                            },
                            "&:disabled": {
                                bgcolor: "primary.main",
                                opacity: 0.6,
                            },
                        }}
                    >
                        {isLoading ? "Loggar in..." : "Logga in"}
                    </Button>

                    <Box sx={{ textAlign: "center", mt: 2 }}>
                        <Typography variant="body2">
                            Har du inget konto?{" "}
                            <Link
                                href="/register"
                                sx={{
                                    color: "primary.main",
                                    textDecoration: "none",
                                    fontWeight: 600,
                                    "&:hover": {
                                        textDecoration: "underline",
                                    },
                                }}
                            >
                                Registrera dig här
                            </Link>
                        </Typography>
                    </Box>
                </Stack>
            </InfoBox>
        </PageLayout>
    )
}