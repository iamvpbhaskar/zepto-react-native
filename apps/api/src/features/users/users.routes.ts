import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { authenticate, type AuthRequest } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validate.middleware'
import { Errors } from '../../middleware/error.middleware'
import type { NextFunction, Response } from 'express'

const router = Router()

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional(),
})

// GET /users/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true, phone: true, email: true, name: true,
        avatarUrl: true, role: true, isVerified: true,
        createdAt: true, updatedAt: true,
      },
    })
    if (!user) return next(Errors.NotFound('User not found'))
    res.json({ success: true, data: { user } })
  } catch (err) { next(err) }
})

// PUT /users/me
router.put('/me', authenticate, validate(updateUserSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: req.body,
      select: {
        id: true, phone: true, email: true, name: true,
        avatarUrl: true, role: true, isVerified: true,
        createdAt: true, updatedAt: true,
      },
    })
    res.json({ success: true, data: { user } })
  } catch (err) { next(err) }
})

export default router
