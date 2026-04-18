import cors from "cors"
import express, { type NextFunction, type Response } from "express"
import helmet from "helmet"
import jwt from "jsonwebtoken"
import { pinoHttp } from "pino-http" // Loggning
import swaggerUi from "swagger-ui-express"
import config from "./config.js"
import db, { initDatabase, seedData } from "./db/database.js"
import logger from "./logger.js" // Loggning
// Importera config och databas
import { createAclMiddleware } from "./middleware/acl.js"
import type { AuthRequest } from "./middleware/auth.js"
// Importera routes
import authRoutes from "./routes/auth.js"
import eventRoutes from "./routes/events.js"
import myEventsRoutes from "./routes/myevents.js"
import registrationRoutes from "./routes/registrations.js"
import { createOpenApiSpec } from "./swagger.js"

const app = express()

const openApiSpec = createOpenApiSpec()

initDatabase()
seedData()

// const isProduction = process.env.NODE_ENV === "production"
// if (!isProduction) {
// 	seedData()
// }

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
app.use(
	pinoHttp({
		logger,
		redact: ["req.body", "req.headers.authorization", "req.headers.cookie"],
		autoLogging: {
			ignore: (req) =>
				req.url?.split("?")[0] === "/api/health" || req.method === "OPTIONS",
		},
		serializers: {
			req(req) {
				return {
					method: req.method,
					url: req.url,
					ip: req.ip,
				}
			},
			res(res) {
				return {
					statusCode: res.statusCode,
				}
			},
		},
	})
)
app.use(helmet()) // Security headers
app.use(cors(corsOptions)) // Cross-origin requests with configuration
app.use(express.json()) // Parse JSON body

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
app.use("/api/myevents", myEventsRoutes)
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

// Global error handler — fångar ohanterade fel som når Express (5xx)
app.use((err: Error, req: AuthRequest, res: Response, next: NextFunction) => {
	logger.error({
		event: "server_error",
		error: err.message,
		stack: err.stack,
		path: req.path,
		method: req.method,
		ip: req.ip,
	})
	if (res.headersSent) {
		return next(err)
	}
	res.status(500).json({ message: "Internt serverfel." })
})

// Starta servern
const PORT = config.server.port

app.listen(PORT, () => {
	console.log(`Joinly API körs på http://localhost:${PORT}`)
	console.log(`Environment: ${config.server.nodeEnv}`)
	console.log(`Health check: http://localhost:${PORT}/api/health`)
	console.log(`Swagger docs: http://localhost:${PORT}/swagger`)
})
