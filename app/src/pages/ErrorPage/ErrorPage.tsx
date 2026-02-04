import { Stack, Typography } from "@mui/material"
import { InfoBox } from "@/components/InfoBox/InfoBox"
import { PageLayout } from "@/components/PageLayout/PageLayout"

export const ErrorPage = () => {
	return (
		<PageLayout>
			<Typography variant="h4" sx={{ fontWeight: 700, mb: 7 }}>
				Ett fel har uppstått
			</Typography>

			<InfoBox>
				<Stack spacing={3} textAlign="left">
					<Typography variant="h6">Något gick fel när sidan skulle laddas.</Typography>

					<Typography variant="body1">Testa att uppdatera sidan eller försök igen senare.</Typography>
				</Stack>
			</InfoBox>
		</PageLayout>
	)
}
