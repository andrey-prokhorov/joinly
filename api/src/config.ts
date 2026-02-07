import "dotenv/config"

// Definiera typer för config
interface Config {
	server: {
		port: number
		nodeEnv: string
	}
	jwt: {
		secret: string
		expiresIn: string
	}
	isProduction: () => boolean
	isDevelopment: () => boolean
	isTest: () => boolean
}

// Konfiguration för Joinly API
export const config: Config = {
	server: {
		port: Number(process.env.PORT) || 3001,
		nodeEnv: process.env.NODE_ENV || "development",
	},

	jwt: {
		secret: process.env.JWT_SECRET || "dev-secret-change-in-production",
		expiresIn: process.env.JWT_EXPIRES_IN || "24h",
	},

	// Hjälpfunktioner
	isProduction() {
		return this.server.nodeEnv === "production"
	},
	isDevelopment() {
		return this.server.nodeEnv === "development"
	},
	isTest() {
		return this.server.nodeEnv === "test"
	},
}

// Säkerhetskoll: varna om default secret i produktion
if (
	config.isProduction() &&
	config.jwt.secret === "dev-secret-change-in-production"
) {
	throw new Error("KRITISKT: JWT_SECRET måste sättas i produktion!")
}

export default config
