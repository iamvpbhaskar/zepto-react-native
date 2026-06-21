import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { authenticate, type AuthRequest } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validate.middleware'
import { Errors } from '../../middleware/error.middleware'
import type { NextFunction, Response } from 'express'

const router = Router()

const addressSchema = z.object({
  label: z.string().min(1).max(50),
  type: z.enum(['HOME', 'WORK', 'OTHER']).default('HOME'),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
  landmark: z.string().max(200).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  isDefault: z.boolean().default(false),
})

// GET /addresses
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.userId, isDeleted: false },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })
    res.json({ success: true, data: { addresses } })
  } catch (err) { next(err) }
})

// POST /addresses
router.post('/', authenticate, validate(addressSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    if (req.body.isDefault) {
      await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } })
    }
    const address = await prisma.address.create({ data: { ...req.body, userId } })
    res.status(201).json({ success: true, data: { address } })
  } catch (err) { next(err) }
})

// PUT /addresses/:id
router.put('/:id', authenticate, validate(addressSchema.partial()), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const existing = await prisma.address.findFirst({ where: { id: req.params.id, userId, isDeleted: false } })
    if (!existing) return next(Errors.NotFound('Address not found'))
    if (req.body.isDefault) {
      await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } })
    }
    const address = await prisma.address.update({ where: { id: req.params.id }, data: req.body })
    res.json({ success: true, data: { address } })
  } catch (err) { next(err) }
})

// DELETE /addresses/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.user!.userId, isDeleted: false },
    })
    if (!existing) return next(Errors.NotFound('Address not found'))
    await prisma.address.update({ 
      where: { id: req.params.id },
      data: { isDeleted: true, isDefault: false }
    })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// PUT /addresses/:id/default
router.put('/:id/default', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const existing = await prisma.address.findFirst({ where: { id: req.params.id, userId, isDeleted: false } })
    if (!existing) return next(Errors.NotFound('Address not found'))
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } })
    const address = await prisma.address.update({ where: { id: req.params.id }, data: { isDefault: true } })
    res.json({ success: true, data: { address } })
  } catch (err) { next(err) }
})

export default router
