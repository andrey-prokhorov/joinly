import { Box, type BoxProps } from "@mui/material"
import type { SxProps, Theme } from "@mui/material/styles"

export interface InfoBoxProps extends BoxProps {
	sx?: SxProps<Theme>
	children: React.ReactNode
}

export const InfoBox: React.FC<InfoBoxProps> = ({ children, sx, ...rest }) => (
	<Box
		sx={{
			mb: 3,
			bgcolor: "surface.secondary",
			p: 4,
			display: "flex",
			justifyContent: "center",
			alignItems: "center",
			...sx,
		}}
		{...rest}
	>
		{children}
	</Box>
)
