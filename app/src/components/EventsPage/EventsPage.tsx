import { Stack, Typography } from "@mui/material"
import { AppBox } from "../AppBox/AppBox"
import { PageLayout } from "../PageLayout/PageLayout"

export const EventsPage = () => (
	<PageLayout>
		<Typography variant="h4" sx={{ fontWeight: 700, mb: 7 }}>
			List med aktiviteter
		</Typography>

		<AppBox>
			<Stack spacing={3} textAlign="left">
				<Typography variant="h6">List med aktiviteter</Typography>

				<Stack spacing={1}>
					<Typography variant="body1">Cykling - Göteborg - Imorgon 10:00</Typography>
					<Typography variant="body1">Motorcykeltur - Malmö - Idag 15:00</Typography>

					<Typography variant="body1">Löpning - Stockholm - Idag 18:00</Typography>
				</Stack>
			</Stack>
		</AppBox>
	</PageLayout>
)
