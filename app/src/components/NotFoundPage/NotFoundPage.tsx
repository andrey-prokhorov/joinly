import { Link, Stack, Typography } from "@mui/material"
import { AppBox } from "../AppBox/AppBox"
import { PageLayout } from "../PageLayout/PageLayout"

export const NotFoundPage = () => (
	<PageLayout>
		<Typography variant="h4" sx={{ fontWeight: 700, mb: 7 }}>
			Sidan kunde inte hittas
		</Typography>

		<AppBox>
			<Stack spacing={3} textAlign="left">
				<Typography variant="h6">Vi kunde tyvärr inte hitta sidan du söker.</Typography>

				<Typography variant="body1">
					Testa att gå till <Link href="/">startsidan</Link>.
				</Typography>
			</Stack>
		</AppBox>
	</PageLayout>
)
