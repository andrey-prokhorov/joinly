import { Stack, Typography } from "@mui/material"
import { AppBox } from "../AppBox/AppBox"
import { PageLayout } from "../PageLayout/PageLayout"

export const StartPage = () => (
	<PageLayout>
		<Typography variant="h4" sx={{ fontWeight: 700, mb: 7 }}>
			Startsida
		</Typography>

		<AppBox>
			<Stack spacing={3} textAlign="left">
				<Typography variant="h6">Välkommen till Joinly!</Typography>

				<Typography variant="body1">
					Joinly är en app för att hitta sällskap för träning – snabbt och utan krångel. Här kan du enkelt hitta eller
					skapa aktiviteter som löpning, cykling eller motorcykelturer i närheten av dig. Du behöver inte gå med i
					grupper eller planera långt i förväg – se vad som händer idag eller imorgon och häng på.
				</Typography>
			</Stack>
		</AppBox>
	</PageLayout>
)
