import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { authenticate, type AuthRequest } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validate.middleware'
import { Errors } from '../../middleware/error.middleware'
import { calcCartSummary } from '@zepto/utils'
import { FREE_DELIVERY_THRESHOLD, DELIVERY_FEE } from '@zepto/config'
import type { Response, NextFunction } from 'express'

const router = Router()

const addItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().max(20),
})

const updateItemSchema = z.object({
  quantity: z.number().int().min(0).max(20),
})

const couponSchema = z.object({
  code: z.string().min(1).toUpperCase(),
})

async function getCartWithSummary(userId: string, couponDiscount = 0) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: { include: { category: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!cart) {
    return {
      cart: { id: null, userId, items: [] },
      summary: {
        subtotal: 0, deliveryFee: 0, discount: 0, total: 0,
        itemCount: 0, isFreeDelivery: false, freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
      },
    }
  }

  const summary = calcCartSummary(cart.items as any, couponDiscount)
  return { cart, summary }
}

// GET /cart
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await getCartWithSummary(req.user!.userId)
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
})

// POST /cart/items
router.post('/items', authenticate, validate(addItemSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { productId, quantity } = req.body
    const userId = req.user!.userId

    const product = await prisma.product.findUnique({ where: { id: productId, isActive: true } })
    if (!product) return next(Errors.NotFound('Product not found'))
    if (product.stock < quantity) return next(Errors.OutOfStock(product.name))

    // Ensure cart exists
    let cart = await prisma.cart.findUnique({ where: { userId } })
    if (!cart) cart = await prisma.cart.create({ data: { userId } })

    // Upsert cart item
    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    })

    if (existing) {
      const newQty = existing.quantity + quantity
      if (product.stock < newQty) return next(Errors.OutOfStock(product.name))
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      })
    } else {
      await prisma.cartItem.create({ data: { cartId: cart.id, productId, quantity } })
    }

    const result = await getCartWithSummary(userId)
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
})

// PUT /cart/items/:productId
router.put('/items/:productId', authenticate, validate(updateItemSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { quantity } = req.body
    const userId = req.user!.userId
    const { productId } = req.params

    const cart = await prisma.cart.findUnique({ where: { userId } })
    if (!cart) return next(Errors.NotFound('Cart not found'))

    const item = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    })
    if (!item) return next(Errors.NotFound('Item not in cart'))

    if (quantity === 0) {
      await prisma.cartItem.delete({ where: { id: item.id } })
    } else {
      const product = await prisma.product.findUnique({ where: { id: productId } })
      if (product && product.stock < quantity) return next(Errors.OutOfStock(product.name))
      await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } })
    }

    const result = await getCartWithSummary(userId)
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
})

// DELETE /cart/items/:productId
router.delete('/items/:productId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const cart = await prisma.cart.findUnique({ where: { userId } })
    if (!cart) return next(Errors.NotFound('Cart not found'))

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id, productId: req.params.productId },
    })

    const result = await getCartWithSummary(userId)
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
})

// DELETE /cart/clear
router.delete('/clear', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const cart = await prisma.cart.findUnique({ where: { userId: req.user!.userId } })
    if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// POST /cart/validate-coupon
router.post('/validate-coupon', authenticate, validate(couponSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body
    const now = new Date()

    const coupon = await prisma.coupon.findUnique({ where: { code } })
    if (!coupon || !coupon.isActive) {
      return res.json({ success: true, data: { valid: false, discount: 0, message: 'Invalid coupon code' } })
    }
    if (coupon.expiresAt && coupon.expiresAt < now) {
      return res.json({ success: true, data: { valid: false, discount: 0, message: 'Coupon has expired' } })
    }
    if (coupon.startsAt && coupon.startsAt > now) {
      return res.json({ success: true, data: { valid: false, discount: 0, message: 'Coupon is not active yet' } })
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.json({ success: true, data: { valid: false, discount: 0, message: 'Coupon usage limit reached' } })
    }

    const { cart, summary } = await getCartWithSummary(req.user!.userId)
    const subtotal = summary.subtotal

    if (subtotal < Number(coupon.minOrderValue)) {
      return res.json({
        success: true,
        data: {
          valid: false, discount: 0,
          message: `Minimum order value is ₹${coupon.minOrderValue}`,
        },
      })
    }

    let discount: number
    if (coupon.discountType === 'FLAT') {
      discount = Number(coupon.discountValue)
    } else {
      discount = Math.round((subtotal * Number(coupon.discountValue)) / 100)
      if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount))
    }
    discount = Math.min(discount, subtotal)

    res.json({ success: true, data: { valid: true, discount, message: `₹${discount} off applied!` } })
  } catch (err) { next(err) }
})

export default router
