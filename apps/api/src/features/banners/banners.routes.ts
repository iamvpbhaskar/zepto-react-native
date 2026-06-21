import { Router } from 'express'
import { prisma } from '../../lib/prisma'
import type { Request, Response, NextFunction } from 'express'

const router = Router()

// GET /banners
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date()
    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        OR: [
          { startsAt: null },
          { startsAt: { lte: now } },
        ],
        AND: [
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: { sortOrder: 'asc' },
    })
    res.json({ success: true, data: { banners } })
  } catch (err) { next(err) }
})

export default router
