// Hjälpfunktioner för rate limiting
// -----------------------------------
// Kan stängas av via RATE_LIMIT_ENABLED=false (t.ex. vid testkörning i CI).
// I produktion ska rate limiting ALLTID vara aktiverat.

import type { NextFunction, Request, Response } from "express"
import rateLimit from "express-rate-limit"
import config from "../config.js"

export const noopMiddleware = (
	_req: Request,
	_res: Response,
	next: NextFunction
) => next()

export const createLimiter = (
	max: number,
	windowMs: number,
	message: string
) =>
	config.rateLimit.enabled
		? rateLimit({
				windowMs,
				max,
				message: { message },
				standardHeaders: true,
				legacyHeaders: false,
			})
		: noopMiddleware
