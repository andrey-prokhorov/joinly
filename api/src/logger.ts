import pino from "pino"

const logger = pino({
	level: process.env.LOG_LEVEL || "info",
	base: { service: "joinly-api" },
	transport:
		process.env.LOG_PRETTY === "true"
			? { target: "pino-pretty", options: { colorize: true } }
			: undefined,
})

export default logger
