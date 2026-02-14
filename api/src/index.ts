import cors from "cors"
import type { NextFunction, Request, Response } from "express"
import express from "express"
import helmet from "helmet"
import jwt from "jsonwebtoken"
import swaggerUi from "swagger-ui-express"
import config from "./config.js"
import db, { initDatabase, seedData } from "./db/database.js"
// Importera config och databas
import { createAclMiddleware } from "./middleware/acl.js"
import type { AuthRequest } from "./middleware/auth.js"
// Importera routes
import authRoutes from "./routes/auth.js"
import eventRoutes from "./routes/events.js"
import registrationRoutes from "./routes/registrations.js"
import { createOpenApiSpec } from "./swagger.js"

const app = express()

// ANSI färgkoder för terminal
const colors = {
	reset: "\x1b[0m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	red: "\x1b[31m",
	cyan: "\x1b[36m",
	gray: "\x1b[90m",
}

// Request logger middleware - visar alla requests i terminalen
const requestLogger = (req: Request, res: Response, next: NextFunction) => {
	const start = Date.now()

	res.on("finish", () => {
		const duration = Date.now() - start
		const status = res.statusCode

		// Färg baserat på statuskod
		let statusColor = colors.green
		if (status >= 400) statusColor = colors.yellow
		if (status >= 500) statusColor = colors.red

		// Metod-färg
		const methodColors: Record<string, string> = {
			GET: colors.cyan,
			POST: colors.green,
			PUT: colors.yellow,
			DELETE: colors.red,
		}
		const methodColor = methodColors[req.method] || colors.reset

		const timestamp = new Date().toLocaleTimeString("sv-SE")

		console.log(
			`${colors.gray}[${timestamp}]${colors.reset} ` +
				`${methodColor}${req.method.padEnd(6)}${colors.reset} ` +
				`${req.originalUrl} ` +
				`${statusColor}${status}${colors.reset} ` +
				`${colors.gray}${duration}ms${colors.reset}`
		)
	})

	next()
}

const isProduction = process.env.NODE_ENV === "production"
const openApiSpec = createOpenApiSpec()

initDatabase()

if (!isProduction) {
	seedData()
}

// CORS configuration
const corsOptions = {
	origin: [
		"http://localhost:3000",
		"https://joinly-frontend-production.up.railway.app",
	],
	credentials: true,
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization"],
}

// Middleware-kedja (ordningen är viktig!)
app.use(helmet()) // Security headers
app.use(cors(corsOptions)) // Cross-origin requests with configuration
app.use(express.json()) // Parse JSON body
app.use(requestLogger) // Logga alla requests
// Optional token - sätter req.user om giltig JWT finns, annars fortsätter utan
// Kollar även blacklist så att utloggade tokens inte ger access
app.use("/api", (req: AuthRequest, _res, next) => {
	const authHeader = req.headers.authorization
	const token =
		authHeader && /^Bearer\s+/i.test(authHeader)
			? authHeader.replace(/^Bearer\s+/i, "").trim()
			: undefined

	if (token) {
		try {
			const blacklisted = db
				.prepare("SELECT id FROM token_blacklist WHERE token = ?")
				.get(token)
			if (!blacklisted) {
				req.user = jwt.verify(token, config.jwt.secret) as AuthRequest["user"]
			}
		} catch {
			// Ogiltig token - fortsätt utan user
		}
	}
	next()
})
// ACL-middleware - kollar access baserat på req.user och ACL-regler i databasen
app.use("/api", createAclMiddleware())

// Använda routes
app.use("/api/auth", authRoutes)
app.use("/api/events", eventRoutes)
app.use("/api/events", registrationRoutes)
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(openApiSpec))

// Health endpoint - användbart för CI/CD och monitoring
app.get("/api/health", (_req, res) => {
	res.json({
		status: "ok",
		timestamp: new Date().toISOString(),
		environment: config.server.nodeEnv,
	})
})

app.get("/", (_req, res) => {
	res.json({
		message:
			"Välkommen till Joinly API! Se swagger-dokumentationen på /swagger",
	})
})

// Starta servern
const PORT = config.server.port

app.listen(PORT, () => {
	console.log(`Joinly API körs på http://localhost:${PORT}`)
	console.log(`Environment: ${config.server.nodeEnv}`)
	console.log(`Health check: http://localhost:${PORT}/api/health`)
	console.log(`Swagger docs: http://localhost:${PORT}/swagger`)
})
