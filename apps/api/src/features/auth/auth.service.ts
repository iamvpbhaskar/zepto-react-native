import { redis } from '../../lib/redis'
import { signAccessToken, signRefreshToken, verifyToken } from '../../lib/jwt'
import { authRepository } from './auth.repository'
import { Errors } from '../../middleware/error.middleware'
import { logger } from '../../lib/logger'
import { OTP_DEV, OTP_EXPIRY_SECONDS } from '@zepto/config'

const OTP_REDIS_PREFIX = 'otp:'

// ─── SEND OTP ────────────────────────────────────────────

export async function sendOtp(phone: string) {
  // In production: integrate Twilio/MSG91
  // For MVP: use a fixed OTP
  const otp = OTP_DEV // '123456' for all numbers in dev

  if (redis) {
    await redis.setex(`${OTP_REDIS_PREFIX}${phone}`, OTP_EXPIRY_SECONDS, otp)
    logger.info({ phone }, `OTP stored in Redis: ${otp}`)
  } else {
    // Fallback: log to console (dev without Redis)
    logger.info({ phone, otp }, 'Mock OTP (no Redis)')
  }

  return { success: true, expiresIn: OTP_EXPIRY_SECONDS }
}

// ─── VERIFY OTP ──────────────────────────────────────────

export async function verifyOtp(phone: string, otp: string) {
  // For MVP: always accept '123456' in dev
  let valid = otp === OTP_DEV

  if (redis && !valid) {
    const stored = await redis.get(`${OTP_REDIS_PREFIX}${phone}`)
    valid = stored === otp
  }

  if (!valid) {
    throw Errors.Validation('Invalid or expired OTP')
  }

  // Delete OTP after use
  if (redis) await redis.del(`${OTP_REDIS_PREFIX}${phone}`)

  // Upsert user
  const user = await authRepository.upsertUser(phone)

  // Ensure wallet exists
  await authRepository.ensureWallet(user.id)

  const payload = { userId: user.id, phone: user.phone, role: user.role as 'CUSTOMER' | 'ADMIN' }
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)

  await authRepository.saveRefreshToken(user.id, refreshToken)

  logger.info({ userId: user.id, phone }, 'User authenticated')

  return { user, accessToken, refreshToken }
}

// ─── REFRESH TOKEN ───────────────────────────────────────

export async function refreshTokens(refreshToken: string) {
  let payload: ReturnType<typeof verifyToken>
  try {
    payload = verifyToken(refreshToken)
  } catch {
    throw Errors.Unauthorized('Invalid refresh token')
  }

  const user = await authRepository.findById(payload.userId)
  if (!user || user.refreshToken !== refreshToken) {
    throw Errors.Unauthorized('Refresh token revoked')
  }

  const newPayload = { userId: user.id, phone: user.phone, role: user.role as 'CUSTOMER' | 'ADMIN' }
  const newAccessToken = signAccessToken(newPayload)
  const newRefreshToken = signRefreshToken(newPayload)

  await authRepository.saveRefreshToken(user.id, newRefreshToken)

  return { accessToken: newAccessToken, refreshToken: newRefreshToken }
}

// ─── LOGOUT ──────────────────────────────────────────────

export async function logout(userId: string) {
  await authRepository.clearRefreshToken(userId)
  return { success: true }
}
