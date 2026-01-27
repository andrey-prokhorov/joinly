import { Box, Container } from "@mui/material"
import { TopMenu } from "../TopMenu/TopMenu"

interface PageLayoutProps {
	children: React.ReactNode
	noMaxWidth?: boolean
	hideMinaSidorMenu?: boolean
}

export const PageLayout = ({ children }: PageLayoutProps) => {
	return (
		<>
			<TopMenu />
			<Container maxWidth="md">
				<Box
					sx={{
						p: { xs: 2, sm: 4, md: 5 },
						margin: "20px auto",
					}}
				>
					{children}
				</Box>
			</Container>
		</>
	)
}
