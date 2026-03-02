import type { PaletteColorOptions } from "@mui/material/styles";

declare module "@mui/material/styles" {
	interface Palette {
		black: Palette["primary"];
		surface: {
			dark: string;
			main: string;
			secondary: string;
			natural: string;
		};
		accent: {
			primary: string;
		};
		hover: {
			light: string;
		};
		error: {
			light: string;
			main: string;
		};
	}

	interface PaletteOptions {
		black?: PaletteColorOptions;
		surface?: {
			dark: string;
			main: string;
			secondary: string;
			natural: string;
		};
		accent: {
			primary: string;
		};
		hover: {
			light: string;
		};
		error: {
			light: string;
			main: string;
		};
	}

	interface TypographyVariants {
		tooltip: React.CSSProperties;
		sectionHeading: React.CSSProperties;
	}

	interface TypographyVariantsOptions {
		sectionHeading?: React.CSSProperties;
		tooltip?: React.CSSProperties;
	}
}

declare module "@mui/material/Button" {
	interface ButtonPropsColorOverrides {
		black: true;
	}
}

declare module "@mui/material/Typography" {
	interface TypographyPropsVariantOverrides {
		sectionHeading: true;
	}

	interface TypographyPropsVariantOverrides {
		tooltip: true;
	}
}
