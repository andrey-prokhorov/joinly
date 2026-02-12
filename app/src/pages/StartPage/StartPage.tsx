import { Stack, Typography, Link } from "@mui/material"
import { InfoBox } from "../../components/InfoBox/InfoBox"
import { PageLayout } from "../../components/PageLayout/PageLayout"

export const StartPage = () => (
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
		<Typography variant="body2">
			Logga in eller registrera dig för att komma igång!{" "}
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
	</PageLayout>
)
