import AccessibilityNewIcon from "@mui/icons-material/AccessibilityNew"
import { Stack } from "@mui/material"

export const Logo = () => (
	<Stack direction="row" alignItems="center">
		<AccessibilityNewIcon sx={{ color: "accent.primary", mt: 1 }} fontSize="medium" />
		<AccessibilityNewIcon sx={{ color: "accent.primary" }} fontSize="medium" />
		<AccessibilityNewIcon sx={{ color: "accent.primary", mt: 1 }} fontSize="medium" />
		<AccessibilityNewIcon sx={{ color: "surface.secondary" }} fontSize="medium" />
	</Stack>
)
