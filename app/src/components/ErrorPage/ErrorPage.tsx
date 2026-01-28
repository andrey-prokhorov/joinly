import { Stack, Typography } from "@mui/material"
import { AppBox } from "../AppBox/AppBox"
import { PageLayout } from "../PageLayout/PageLayout"

export const ErrorPage = () => {
	return (
		<PageLayout>
			<Typography variant="h4" sx={{ fontWeight: 700, mb: 7 }}>
				Ett fel har uppstått
			</Typography>

			<AppBox>
				<Stack spacing={3} textAlign="left">
					<Typography variant="h6">Något gick fel när sidan skulle laddas.</Typography>

					<Typography variant="body1">Testa att uppdatera sidan eller försök igen senare.</Typography>
				</Stack>
			</AppBox>
		</PageLayout>
	)
}
