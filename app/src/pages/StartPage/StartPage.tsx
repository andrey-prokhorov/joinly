import { Button, Stack, Typography } from "@mui/material"
import { Link } from "@tanstack/react-router"
import { useAuth } from "@/useAuth"
import { InfoBox } from "../../components/InfoBox/InfoBox"
import { PageLayout } from "../../components/PageLayout/PageLayout"

export const StartPage = () => {
	const { isAuthenticated } = useAuth()

	return (
		<PageLayout>
			<Typography variant="h4" sx={{ fontWeight: 700, mb: 7 }}>
				Startsida
			</Typography>

			<InfoBox>
				<Stack spacing={3} textAlign="left" py={2}>
					<Typography variant="h6">
						Välkommen till <span color="accent.primary">joinly</span>!
					</Typography>

					<Typography variant="body1">
						Joinly är en app för att hitta sällskap för träning – snabbt och utan krångel. Här kan du enkelt hitta eller
						skapa aktiviteter som löpning, cykling eller motorcykelturer i närheten av dig. Du behöver inte gå med i
						grupper eller planera långt i förväg – se vad som händer idag eller imorgon och häng på.
					</Typography>
				</Stack>
			</InfoBox>

			{!isAuthenticated && (
				<Stack direction="row" spacing={2} sx={{ justifyContent: "center", alignItems: "center" }}>
					<Button variant="contained" color="primary" component={Link} to="/login" sx={{ mb: 2 }}>
						Logga in
					</Button>
					<Button variant="contained" color="primary" component={Link} to="/register" sx={{ mb: 2 }}>
						Registrera dig
					</Button>
				</Stack>
			)}
		</PageLayout>
	)
}
