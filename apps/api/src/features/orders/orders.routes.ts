import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { authenticate, type AuthRequest } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validate.middleware'
import { Errors } from '../../middleware/error.middleware'
import { generateOrderNumber, getPaginationMeta } from '@zepto/utils'
import { CANCELLABLE_STATUSES, FREE_DELIVERY_THRESHOLD, DELIVERY_FEE } from '@zepto/config'
import { delCache } from '../../lib/redis'
import type { Response, NextFunction } from 'express'
import type { Prisma } from '@prisma/client'

const router = Router()

export async function syncMockDeliveryStatus() {
  try {
    const testUsers = await prisma.user.findMany({
      where: { phone: { in: ['9999999999', '8409916425'] } },
      select: { id: true },
    })
    
    if (testUsers.length === 0) return

    const testUserIds = testUsers.map((u: any) => u.id)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    const pendingOrders = await prisma.order.findMany({
      where: {
        userId: { in: testUserIds },
        status: { notIn: ['DELIVERED', 'CANCELLED', 'REFUNDED'] },
        createdAt: { lte: fiveMinutesAgo },
      },
    })

    for (const order of pendingOrders) {
      await prisma.$transaction(async (tx: any) => {
        const currentOrder = await tx.order.findUnique({
          where: { id: order.id },
          select: { status: true },
        })
        if (currentOrder && !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(currentOrder.status)) {
          await tx.order.update({
            where: { id: order.id },
            data: { status: 'DELIVERED', deliveredAt: new Date() },
          })
          await tx.orderTimeline.create({
            data: {
              orderId: order.id,
              status: 'DELIVERED',
              message: 'Order delivered (Mock Auto-Delivery)',
            },
          })
          await tx.notification.create({
            data: {
              userId: order.userId,
              title: 'Order Delivered! 🎉',
              body: `Your order ${order.orderNumber} has been delivered. Thank you!`,
              type: 'ORDER_UPDATE',
              data: { orderId: order.id, orderNumber: order.orderNumber },
            },
          })
        }
      })
    }
  } catch (error) {
    console.error('Error syncing mock delivery status:', error)
  }
}

const placeOrderSchema = z.object({
  addressId: z.string().uuid(),
  paymentMethod: z.enum(['WALLET', 'COD']),
  couponCode: z.string().optional(),
  notes: z.string().max(500).optional(),
})

const cancelOrderSchema = z.object({
  reason: z.string().min(1).max(500),
})

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  status: z.enum(['PENDING', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
})

// GET /orders
router.get('/', authenticate, validate(listQuerySchema, 'query'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await syncMockDeliveryStatus()
    const { page, limit, status } = req.query as unknown as z.infer<typeof listQuerySchema>
    const where: Prisma.OrderWhereInput = {
      userId: req.user!.userId,
      ...(status ? { status } : {}),
    }
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { items: true, address: true },
      }),
      prisma.order.count({ where }),
    ])
    res.json({ success: true, data: { orders, ...getPaginationMeta(total, page, limit) } })
  } catch (err) { next(err) }
})

// GET /orders/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await syncMockDeliveryStatus()
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      include: {
        items: { include: { product: true } },
        address: true,
        timeline: { orderBy: { createdAt: 'asc' } },
        walletTransaction: true,
      },
    })
    if (!order) return next(Errors.NotFound('Order not found'))
    res.json({ success: true, data: { order } })
  } catch (err) { next(err) }
})

// POST /orders — Atomic order placement
router.post('/', authenticate, validate(placeOrderSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { addressId, paymentMethod, couponCode, notes } = req.body
    const userId = req.user!.userId

    const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Fetch cart with items
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true } } },
      })
      if (!cart || cart.items.length === 0) throw Errors.CartEmpty()

      // 2. Validate address belongs to user
      const address = await tx.address.findFirst({ where: { id: addressId, userId } })
      if (!address) throw Errors.NotFound('Address not found')

      // 3. Re-validate product stock
      for (const item of cart.items) {
        if (!item.product.isActive) throw Errors.NotFound(`${item.product.name} is no longer available`)
        if (item.product.stock < item.quantity) throw Errors.OutOfStock(item.product.name)
      }

      // 4. Calculate pricing
      const subtotal = cart.items.reduce((acc: number, item: any) => acc + Number(item.product.price) * item.quantity, 0)
      const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE

      // Apply coupon if provided
      let discount = 0
      if (couponCode) {
        const coupon = await tx.coupon.findUnique({ where: { code: couponCode } })
        if (coupon && coupon.isActive && Number(coupon.minOrderValue) <= subtotal) {
          if (coupon.discountType === 'FLAT') {
            discount = Number(coupon.discountValue)
          } else {
            discount = Math.round((subtotal * Number(coupon.discountValue)) / 100)
            if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount))
          }
          discount = Math.min(discount, subtotal)
          // Increment coupon usage
          await tx.coupon.update({ where: { code: couponCode }, data: { usedCount: { increment: 1 } } })
        }
      }

      const total = Math.max(0, subtotal + deliveryFee - discount)

      // 5. Wallet payment check
      if (paymentMethod === 'WALLET') {
        const wallet = await tx.wallet.findUnique({ where: { userId } })
        if (!wallet || Number(wallet.balance) < total) throw Errors.InsufficientBalance()
      }

      // 6. Create order
      const orderNumber = generateOrderNumber()
      const estimatedAt = new Date(Date.now() + 10 * 60 * 1000) // 10 min delivery

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId,
          status: 'PENDING',
          paymentMethod,
          subtotal,
          deliveryFee,
          discount,
          total,
          couponCode,
          notes,
          estimatedAt,
        },
      })

      // 7. Create order items (snapshot)
      await tx.orderItem.createMany({
        data: cart.items.map((item: any) => ({
          orderId: newOrder.id,
          productId: item.productId,
          productName: item.product.name,
          productImage: item.product.images[0] ?? null,
          unit: item.product.unit,
          quantity: item.quantity,
          mrp: item.product.mrp,
          price: item.product.price,
          total: Number(item.product.price) * item.quantity,
        })),
      })

      // 8. Create order timeline
      await tx.orderTimeline.create({
        data: { orderId: newOrder.id, status: 'PENDING', message: 'Your order has been placed' },
      })

      // 9. Wallet deduction
      if (paymentMethod === 'WALLET') {
        const wallet = await tx.wallet.findUnique({ where: { userId } })!
        const newBalance = Number(wallet!.balance) - total
        await tx.wallet.update({ where: { userId }, data: { balance: newBalance } })
        await tx.walletTransaction.create({
          data: {
            walletId: wallet!.id,
            orderId: newOrder.id,
            type: 'DEBIT',
            status: 'SUCCESS',
            amount: total,
            balanceBefore: Number(wallet!.balance),
            balanceAfter: newBalance,
            description: `Payment for order ${orderNumber}`,
          },
        })
      }

      // 10. Decrement stock
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
      }

      // 11. Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } })

      // 12. Create notification
      await tx.notification.create({
        data: {
          userId,
          title: 'Order Placed! 🛒',
          body: `Your order ${orderNumber} has been placed. Arriving in 10 minutes!`,
          type: 'ORDER_UPDATE',
          data: { orderId: newOrder.id, orderNumber },
        },
      })

      // Invalidate wallet cache
      await delCache(`wallet:${userId}`)

      return newOrder
    })

    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true, address: true, timeline: true },
    })

    res.status(201).json({ success: true, data: { order: fullOrder } })
  } catch (err) { next(err) }
})

// PUT /orders/:id/cancel
router.put('/:id/cancel', authenticate, validate(cancelOrderSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body
    const userId = req.user!.userId

    const updatedOrder = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const order = await tx.order.findFirst({
        where: { id: req.params.id, userId },
        include: { items: true, walletTransaction: true },
      })
      if (!order) throw Errors.NotFound('Order not found')
      if (!CANCELLABLE_STATUSES.includes(order.status as any)) throw Errors.OrderNotCancellable()

      // 1. Update order status
      const cancelled = await tx.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: reason },
      })

      // 2. Add timeline entry
      await tx.orderTimeline.create({
        data: { orderId: order.id, status: 'CANCELLED', message: `Cancelled: ${reason}` },
      })

      // 3. Restore stock
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      }

      // 4. Refund wallet if paid by wallet
      if (order.paymentMethod === 'WALLET') {
        const wallet = await tx.wallet.findUnique({ where: { userId } })
        const refundAmount = Number(order.total)
        const newBalance = Number(wallet!.balance) + refundAmount
        await tx.wallet.update({ where: { userId }, data: { balance: newBalance } })
        await tx.walletTransaction.create({
          data: {
            walletId: wallet!.id,
            type: 'REFUND',
            status: 'SUCCESS',
            amount: refundAmount,
            balanceBefore: Number(wallet!.balance),
            balanceAfter: newBalance,
            description: `Refund for cancelled order ${order.orderNumber}`,
          },
        })
        // Update order status to REFUNDED
        await tx.order.update({ where: { id: order.id }, data: { status: 'REFUNDED' } })
        await tx.orderTimeline.create({
          data: { orderId: order.id, status: 'REFUNDED', message: `₹${refundAmount} refunded to wallet` },
        })
        // Notification
        await tx.notification.create({
          data: {
            userId,
            title: 'Refund Processed 💰',
            body: `₹${refundAmount} has been refunded to your wallet`,
            type: 'WALLET',
            data: { orderId: order.id },
          },
        })
      }

      await delCache(`wallet:${userId}`)
      return cancelled
    })

    const fullOrder = await prisma.order.findUnique({
      where: { id: updatedOrder.id },
      include: { items: true, address: true, timeline: { orderBy: { createdAt: 'asc' } } },
    })

    res.json({ success: true, data: { order: fullOrder } })
  } catch (err) { next(err) }
})

// POST /orders/:id/reorder
router.post('/:id/reorder', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId

    // 1. Fetch original order items
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId },
      include: { items: true },
    })
    if (!order) return next(Errors.NotFound('Order not found'))

    // 2. Ensure cart exists
    let cart = await prisma.cart.findUnique({ where: { userId } })
    if (!cart) cart = await prisma.cart.create({ data: { userId } })

    // 3. Add each item (merge with existing)
    for (const item of order.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId, isActive: true },
      })
      if (!product) continue // Skip unavailable products

      const existing = await prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId: item.productId } },
      })

      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + item.quantity },
        })
      } else {
        await prisma.cartItem.create({
          data: { cartId: cart.id, productId: item.productId, quantity: item.quantity },
        })
      }
    }

    // 4. Return updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: { include: { category: true } } } } },
    })

    res.json({ success: true, data: { cart: updatedCart } })
  } catch (err) { next(err) }
})

export default router
