import { Button, type SxProps, type Theme } from "@mui/material"
import { Link } from "@tanstack/react-router"
import type React from "react"

type MenuButtonProps = React.ComponentProps<typeof Button> & { to?: string }

const defaultSx: SxProps<Theme> = {
	color: "black.main",
	padding: "20px 16px",
	fontSize: "16px",
	fontWeight: 600,
	textTransform: "none",
	backgroundColor: "secondary.light",
	borderRadius: 0,
	boxShadow: "none",
	"&:hover": {
		backgroundColor: "secondary.main",
	},
}

export const MenuButton = ({ sx, ...props }: MenuButtonProps) => {
	return <Button variant="text" LinkComponent={Link} sx={{ ...defaultSx, ...sx }} {...props} />
}
