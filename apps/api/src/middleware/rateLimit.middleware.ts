import rateLimit from 'express-rate-limit'
import { Errors } from './error.middleware'

export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    const err = Errors.RateLimit()
    res.status(429).json({
      success: false,
      error: { code: err.code, message: err.message },
    })
  },
})

export const otpRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 3,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many OTP requests' } },
  standardHeaders: true,
  legacyHeaders: false,
})
