import { Router } from 'express'
import * as authController from './auth.controller'
import { validate } from '../../middleware/validate.middleware'
import { authenticate } from '../../middleware/auth.middleware'
import { otpRateLimit } from '../../middleware/rateLimit.middleware'
import { sendOtpSchema, verifyOtpSchema, refreshSchema } from './auth.schema'

const router = Router()

router.post('/send-otp', otpRateLimit, validate(sendOtpSchema), authController.sendOtp)
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOtp)
router.post('/refresh', validate(refreshSchema), authController.refresh)
router.post('/logout', authenticate, authController.logout)

export default router
