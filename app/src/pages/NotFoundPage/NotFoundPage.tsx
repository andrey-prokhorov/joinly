import { Link, Stack, Typography } from "@mui/material"
import { InfoBox } from "../../components/InfoBox/InfoBox"
import { PageLayout } from "../../components/PageLayout/PageLayout"

export const NotFoundPage = () => (
	<PageLayout>
		<Typography variant="h4" sx={{ fontWeight: 700, mb: 7 }}>
			Sidan kunde inte hittas
		</Typography>

		<InfoBox>
			<Stack spacing={3} textAlign="left">
				<Typography variant="h6">Vi kunde tyvärr inte hitta sidan du söker.</Typography>

				<Typography variant="body1">
					Testa att gå till <Link href="/">startsidan</Link>.
				</Typography>
			</Stack>
		</InfoBox>
	</PageLayout>
)
