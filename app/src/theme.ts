import { createTheme, type ThemeOptions } from "@mui/material/styles"

export const themeOptions: ThemeOptions = {
	typography: {
		fontFamily: "'Segoe UI', Arial, sans-serif",
	},

	palette: {
		mode: "light",
		primary: {
			main: "#09637E",
			light: "#EBF4F6",
		},
		secondary: {
			dark: "#088395",
			main: "#7AB2B2",
			light: "#EBF4F6",
		},
		text: {
			primary: "#000000",
			secondary: "#6B6B6B",
		},
		black: {
			main: "#000000",
		},
		surface: {
			dark: "#7AB2B2",
			main: "#FFF7F0",
			secondary: "#F4F4F4",
		},
		background: {
			default: "#FFF7F0",
		},
		accent: {
			primary: "#F0E491",
		},
		hover: {
			light: "#0000EE",
		},
		error: {
			light: "#FAE5E7",
			main: "#B80000",
		},
	},

	shape: {
		borderRadius: 0,
	},

	components: {
		MuiAlert: {
			variants: [
				{
					props: { severity: "info" },
					style: ({ theme }) => ({
						color: "black",
						backgroundColor: theme.palette.secondary.main,
						"& .MuiAlert-icon": { color: "black" },
					}),
				},
				{
					props: { severity: "error" },
					style: ({ theme }) => ({
						color: theme.palette.error.main,
						backgroundColor: theme.palette.error.light,
						"& .MuiAlert-icon": { visibility: "hidden" },
						"& .MuiSvgIcon-root": { color: theme.palette.error.main },
					}),
				},
			],
		},

		MuiSvgIcon: {
			styleOverrides: {
				root: {
					color: "black",
				},
			},
		},
	},
}

export const theme = createTheme(themeOptions)
