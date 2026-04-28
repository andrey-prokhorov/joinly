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

const app = express()

// Aktivera trust proxy bara i produktion — appen körs då bakom en reverse proxy
// (Railway, nginx m.fl.) som sätter X-Forwarded-For med klientens riktiga IP.
// I dev/CI finns ingen proxy: utan detta villkor kan en klient sätta X-Forwarded-For
// till valfri IP och kringgå IP-baserad rate limiting.
if (config.isProduction()) {
	app.set("trust proxy", 1)
}

initDatabase()
seedData()

// const isProduction = process.env.NODE_ENV === "production"
// if (!isProduction) {
// 	seedData()
// }

// CORS configuration
// CORS_ORIGIN sätts som env-variabel i Railway för att tillåta app-servicens publika URL
const corsOptions = {
	origin: [
		"http://localhost:3000",
		"https://joinly-frontend-production.up.railway.app",
		process.env.CORS_ORIGIN,
	].filter(Boolean) as string[],
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
app.use(express.json({ limit: "10kb" })) // Parse JSON body, limit skyddar mot stora payload-attacker

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
if (config.swagger.enabled) {
	// Dynamisk import — swagger-jsdoc är ett dev-verktyg och saknas i prod-imagen.
	// Swagger exponeras aldrig i produktion (SWAGGER_ENABLED=true krävs).
	const { createOpenApiSpec } = await import("./swagger.js")
	const openApiSpec = createOpenApiSpec()
	app.use("/swagger", swaggerUi.serve, swaggerUi.setup(openApiSpec))
}

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
		message: config.swagger.enabled
			? "Välkommen till Joinly API! Se swagger-dokumentationen på /swagger"
			: "Välkommen till Joinly API!",
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
	if (config.swagger.enabled) {
		if (config.isProduction()) {
			console.warn(
				"VARNING: Swagger är aktiverat i produktion. Inaktivera i prod."
			)
		}
		console.log(`Swagger docs: http://localhost:${PORT}/swagger`)
	} else {
		console.log("Swagger: avstängt (SWAGGER_ENABLED != true)")
	}
	if (config.rateLimit.enabled) {
		console.log("Rate limiting: aktiverat")
	} else {
		console.warn("Rate limiting: AVSTÄNGT (RATE_LIMIT_ENABLED=false)")
	}
})
