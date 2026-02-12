import { useState } from "react"
import { Stack, TextField, Button, Typography, Box, Link } from "@mui/material"
import { InfoBox } from "../../components/InfoBox/InfoBox"
import { PageLayout } from "../../components/PageLayout/PageLayout"
import { apiService } from "@/api"

export const RegisterPage = () => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [name, setName] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    const validatePassword = (password: string): boolean => {
        return password.length >= 8
    }

    const handleRegister = async () => {
        setError("")
        setSuccess("")

        if (!email || !password || !confirmPassword) {
            setError("Alla fält är obligatoriska")
            return
        }

        if (!validateEmail(email)) {
            setError("Vänligen ange en giltig e-postadress")
            return
        }

        if (!validatePassword(password)) {
            setError("Lösenordet måste vara minst 8 tecken långt")
            return
        }

        if (password !== confirmPassword) {
            setError("Lösenorden matchar inte")
            return
        }

        setIsLoading(true)

        try {
            const response = await apiService.register(email, password, name)

            if (!response.ok) {
                const data = await response.json()
                setError(data.message || "Registreringen misslyckades")
                return
            }

            const data = await response.json()
            setSuccess("Konto skapat framgångsrikt! Omdirigerar...")
            // Store the JWT token
            apiService.setToken(data.token)
            setTimeout(() => {
                window.location.href = "/events"
            }, 1500)
        } catch (err) {
            setError("Ett fel uppstod vid registreringen")
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleRegister()
        }
    }

    return (
        <PageLayout>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 7 }}>
                Registrera konto
            </Typography>

            <InfoBox>
                <Stack spacing={3} sx={{ width: "100%", maxWidth: 400 }}>
                    <Typography variant="body1" sx={{ textAlign: "center", mb: 2 }}>
                        Skapa ett nytt Joinly-konto
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

                    {success && (
                        <Box
                            sx={{
                                p: 2,
                                bgcolor: "secondary.main",
                                color: "white",
                                borderRadius: 1,
                                textAlign: "center",
                            }}
                        >
                            {success}
                        </Box>
                    )}

                    <TextField
                        label="E-postadress"
                        type="email"
                        variant="outlined"
                        fullWidth
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        placeholder="Din e-postadress"
                    />

                                <TextField
                        label="Namn"
                        type="Text"
                        variant="outlined"
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isLoading}
                        placeholder="Ditt namn"
                    />


                    <TextField
                        label="Lösenord"
                        type="password"
                        variant="outlined"
                        fullWidth
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        placeholder="Minst 8 tecken"
                        helperText="Lösenordet måste vara minst 8 tecken långt"
                    />

                    <TextField
                        label="Bekräfta lösenord"
                        type="password"
                        variant="outlined"
                        fullWidth
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                        placeholder="Upprepa lösenordet"
                    />

                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleRegister}
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
                        {isLoading ? "Registrerar..." : "Registrera konto"}
                    </Button>

                    <Box sx={{ textAlign: "center", mt: 2 }}>
                        <Typography variant="body2">
                            Har du redan ett konto?{" "}
                            <Link
                                href="/login"
                                sx={{
                                    color: "primary.main",
                                    textDecoration: "none",
                                    fontWeight: 600,
                                    "&:hover": {
                                        textDecoration: "underline",
                                    },
                                }}
                            >
                                Logga in här
                            </Link>
                        </Typography>
                    </Box>
                </Stack>
            </InfoBox>
        </PageLayout>
    )
}