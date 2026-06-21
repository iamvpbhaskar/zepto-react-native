import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { authenticate, type AuthRequest } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validate.middleware'
import { Errors } from '../../middleware/error.middleware'
import { getPaginationMeta } from '@zepto/utils'
import type { Response, NextFunction } from 'express'

const router = Router()

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
})

// GET /notifications
router.get('/', authenticate, validate(listQuerySchema, 'query'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query as unknown as z.infer<typeof listQuerySchema>
    const userId = req.user!.userId
    const where = { userId }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ])

    res.json({ success: true, data: { notifications, unreadCount, ...getPaginationMeta(total, page, limit) } })
  } catch (err) { next(err) }
})

// PUT /notifications/read-all
router.put('/read-all', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, isRead: false },
      data: { isRead: true },
    })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// PUT /notifications/:id/read
router.put('/:id/read', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!notification) return next(Errors.NotFound('Notification not found'))
    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    })
    res.json({ success: true, data: { notification: updated } })
  } catch (err) { next(err) }
})

export default router
