import "dotenv/config";

// Konfiguration för Joinly API
// Prioritet: miljövariabler > defaults

export const config = {
	server: {
		port: Number(process.env.PORT) || 3001,
		nodeEnv: process.env.NODE_ENV || "development",
	},

	// Hjälpfunktioner
	isProduction: () => config.server.nodeEnv === "production",
	isDevelopment: () => config.server.nodeEnv === "development",
	isTest: () => config.server.nodeEnv === "test",
} as const;

export default config;
