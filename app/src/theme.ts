import { createTheme, type ThemeOptions } from "@mui/material/styles"

const baseTheme = createTheme()

export const themeOptions: ThemeOptions = {
	typography: {
		fontFamily: "'Segoe UI', Arial, sans-serif",

		h1: {
			fontSize: "80px",
			lineHeight: "86px",
			[baseTheme.breakpoints.down("md")]: {
				fontSize: "36px",
				lineHeight: "43px",
			},
		},
		h2: {
			fontSize: "60px",
			lineHeight: "66px",
			[baseTheme.breakpoints.down("md")]: {
				fontSize: "32px",
				lineHeight: "38px",
			},
		},
		h3: {
			fontSize: "36px",
			lineHeight: "40px",
			[baseTheme.breakpoints.down("md")]: {
				fontSize: "27px",
				lineHeight: "32px",
			},
		},
		h4: {
			fontSize: "30px",
			lineHeight: "36px",
			[baseTheme.breakpoints.down("md")]: {
				fontSize: "24px",
				lineHeight: "28px",
			},
		},
		h5: {
			fontSize: "24px",
			lineHeight: "28px",
			[baseTheme.breakpoints.down("md")]: {
				fontSize: "18px",
				lineHeight: "26px",
			},
		},
		h6: {
			fontSize: "16px",
			lineHeight: "19px",
			fontWeight: 700,
			color: "black",
			[baseTheme.breakpoints.down("md")]: {
				fontSize: "16px",
				lineHeight: "19px",
			},
		},
		body1: {
			fontSize: "16px",
			lineHeight: "24px",
			[baseTheme.breakpoints.down("md")]: {
				fontSize: "16px",
				lineHeight: "24px",
			},
		},
		body2: {
			fontSize: "14px",
			lineHeight: "17px",
			[baseTheme.breakpoints.down("md")]: {
				fontSize: "14px",
				lineHeight: "17px",
			},
		},
	},

	palette: {
		mode: "light",
		primary: {
			main: "#E26A34",
			light: "#e5815e",
		},
		secondary: {
			dark: "#657B71",
			main: "#E89C85",
			light: "#FDDCC0",
		},
		text: {
			primary: "#000000",
			secondary: "#6B6B6B",
		},
		black: {
			main: "#000000",
		},
		surface: {
			dark: "#C3491C",
			main: "#FFF7F0",
			secondary: "#F4F4F4",
		},
		background: {
			default: "#FFF7F0",
		},
		accent: {
			primary: "#E5F0FF",
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
