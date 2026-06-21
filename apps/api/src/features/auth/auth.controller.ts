import type { Request, Response, NextFunction } from 'express'
import * as authService from './auth.service'
import type { AuthRequest } from '../../middleware/auth.middleware'

export const sendOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.sendOtp(req.body.phone)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.verifyOtp(req.body.phone, req.body.otp)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.refreshTokens(req.body.refreshToken)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export const logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await authService.logout(req.user!.userId)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}
