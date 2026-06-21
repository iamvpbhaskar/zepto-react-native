import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { authenticate, requireAdmin, type AuthRequest } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validate.middleware'
import { Errors } from '../../middleware/error.middleware'
import { getPaginationMeta, generateSlug } from '@zepto/utils'
import { delCache, delCachePattern } from '../../lib/redis'
import { syncMockDeliveryStatus } from '../orders/orders.routes'
import type { Response, NextFunction } from 'express'
import type { Prisma } from '@prisma/client'

const router = Router()

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin)

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
})

// ─── DASHBOARD STATS ─────────────────────────────────────

router.get('/stats', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await syncMockDeliveryStatus()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [totalOrders, totalUsers, activeProducts, todayOrders, revenueAgg, todayRevenueAgg] =
      await Promise.all([
        prisma.order.count({ where: { status: { not: 'CANCELLED' } } }),
        prisma.user.count({ where: { role: 'CUSTOMER' } }),
        prisma.product.count({ where: { isActive: true } }),
        prisma.order.count({ where: { createdAt: { gte: today }, status: { not: 'CANCELLED' } } }),
        prisma.order.aggregate({
          where: { status: { not: 'CANCELLED' } },
          _sum: { total: true },
        }),
        prisma.order.aggregate({
          where: { createdAt: { gte: today }, status: { not: 'CANCELLED' } },
          _sum: { total: true },
        }),
      ])

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: Number(revenueAgg._sum.total ?? 0),
        totalUsers,
        activeProducts,
        todayOrders,
        todayRevenue: Number(todayRevenueAgg._sum.total ?? 0),
      },
    })
  } catch (err) { next(err) }
})

// ─── PRODUCTS ────────────────────────────────────────────

const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
})

const createProductSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  images: z.array(z.string().url()).min(1),
  mrp: z.number().positive(),
  price: z.number().positive(),
  unit: z.string().min(1),
  stock: z.number().int().min(0).default(0),
  isFeatured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional(),
})

router.get('/products', validate(productQuerySchema, 'query'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page, limit, search, categoryId, isActive } = req.query as unknown as z.infer<typeof productQuerySchema>
    const where: Prisma.ProductWhereInput = {
      ...(categoryId ? { categoryId } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    }
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where, orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit, take: limit,
        include: { category: true },
      }),
      prisma.product.count({ where }),
    ])
    res.json({ success: true, data: { products, ...getPaginationMeta(total, page, limit) } })
  } catch (err) { next(err) }
})

router.post('/products', validate(createProductSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const slug = generateSlug(req.body.name)
    const product = await prisma.product.create({ data: { ...req.body, slug }, include: { category: true } })
    await delCachePattern('products:*')
    res.status(201).json({ success: true, data: { product } })
  } catch (err) { next(err) }
})

router.put('/products/:id', validate(createProductSchema.partial()), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data: any = { ...req.body }
    if (req.body.name) data.slug = generateSlug(req.body.name)
    const product = await prisma.product.update({ where: { id: req.params.id }, data, include: { category: true } })
    await delCachePattern('products:*')
    res.json({ success: true, data: { product } })
  } catch (err) { next(err) }
})

router.delete('/products/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } })
    await delCachePattern('products:*')
    res.json({ success: true })
  } catch (err) { next(err) }
})

router.put('/products/:id/stock', validate(z.object({ stock: z.number().int().min(0) })), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { stock: req.body.stock },
    })
    res.json({ success: true, data: { product } })
  } catch (err) { next(err) }
})

// ─── CATEGORIES ──────────────────────────────────────────

const categorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

router.get('/categories', async (_req, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    })
    res.json({ success: true, data: { categories } })
  } catch (err) { next(err) }
})

router.post('/categories', validate(categorySchema), async (req, res: Response, next: NextFunction) => {
  try {
    const slug = generateSlug(req.body.name)
    const category = await prisma.category.create({ data: { ...req.body, slug } })
    await delCache('categories:all')
    res.status(201).json({ success: true, data: { category } })
  } catch (err) { next(err) }
})

router.put('/categories/:id', validate(categorySchema.partial()), async (req, res: Response, next: NextFunction) => {
  try {
    const data: any = { ...req.body }
    if (req.body.name) data.slug = generateSlug(req.body.name)
    const category = await prisma.category.update({ where: { id: req.params.id }, data })
    await delCache('categories:all')
    res.json({ success: true, data: { category } })
  } catch (err) { next(err) }
})

router.delete('/categories/:id', async (req, res: Response, next: NextFunction) => {
  try {
    await prisma.category.update({ where: { id: req.params.id }, data: { isActive: false } })
    await delCache('categories:all')
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ─── ORDERS ──────────────────────────────────────────────

const orderQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  status: z.enum(['PENDING','CONFIRMED','PACKED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED','REFUNDED']).optional(),
})

const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING','CONFIRMED','PACKED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED','REFUNDED']),
  message: z.string().optional(),
})

router.get('/orders', validate(orderQuerySchema, 'query'), async (req, res: Response, next: NextFunction) => {
  try {
    await syncMockDeliveryStatus()
    const { page, limit, status } = req.query as unknown as z.infer<typeof orderQuerySchema>
    const where: Prisma.OrderWhereInput = status ? { status } : {}
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where, orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit, take: limit,
        include: { user: { select: { id: true, name: true, phone: true } }, address: true, items: true },
      }),
      prisma.order.count({ where }),
    ])
    res.json({ success: true, data: { orders, ...getPaginationMeta(total, page, limit) } })
  } catch (err) { next(err) }
})

router.put('/orders/:id/status', validate(updateOrderStatusSchema), async (req, res: Response, next: NextFunction) => {
  try {
    const { status, message } = req.body
    const order = await prisma.order.findUnique({ where: { id: req.params.id } })
    if (!order) return next(Errors.NotFound('Order not found'))

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status,
        ...(status === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
      },
    })

    await prisma.orderTimeline.create({
      data: { orderId: order.id, status, message },
    })

    await prisma.notification.create({
      data: {
        userId: order.userId,
        title: `Order ${status === 'DELIVERED' ? 'Delivered! 🎉' : 'Updated'}`,
        body: message ?? `Your order status has been updated to ${status}`,
        type: 'ORDER_UPDATE',
        data: { orderId: order.id },
      },
    })

    res.json({ success: true, data: { order: updated } })
  } catch (err) { next(err) }
})

// ─── CUSTOMERS ───────────────────────────────────────────

router.get('/customers', validate(paginationSchema, 'query'), async (req, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query as unknown as z.infer<typeof paginationSchema>
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { role: 'CUSTOMER' },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { wallet: true, _count: { select: { orders: true } } },
      }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
    ])
    res.json({ success: true, data: { customers: users, ...getPaginationMeta(total, page, limit) } })
  } catch (err) { next(err) }
})

router.get('/customers/:id', async (req, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        wallet: { include: { transactions: { orderBy: { createdAt: 'desc' }, take: 10 } } },
        orders: { orderBy: { createdAt: 'desc' }, take: 10, include: { items: true } },
        addresses: true,
      },
    })
    if (!user) return next(Errors.NotFound('Customer not found'))
    res.json({ success: true, data: { customer: user } })
  } catch (err) { next(err) }
})

// ─── WALLET ADMIN ─────────────────────────────────────────

router.get('/wallet/transactions', validate(paginationSchema, 'query'), async (req, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query as unknown as z.infer<typeof paginationSchema>
    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { wallet: { include: { user: { select: { id: true, name: true, phone: true } } } } },
      }),
      prisma.walletTransaction.count(),
    ])
    res.json({ success: true, data: { transactions, ...getPaginationMeta(total, page, limit) } })
  } catch (err) { next(err) }
})

router.post('/wallet/credit', validate(z.object({ userId: z.string().uuid(), amount: z.number().positive(), description: z.string() })), async (req, res: Response, next: NextFunction) => {
  try {
    const { userId, amount, description } = req.body
    const wallet = await prisma.wallet.findUnique({ where: { userId } })
    if (!wallet) return next(Errors.NotFound('Wallet not found'))
    const newBalance = Number(wallet.balance) + amount
    const [updatedWallet, tx] = await prisma.$transaction([
      prisma.wallet.update({ where: { id: wallet.id }, data: { balance: newBalance } }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id, type: 'CREDIT', status: 'SUCCESS',
          amount, balanceBefore: Number(wallet.balance), balanceAfter: newBalance, description,
        },
      }),
    ])
    await delCache(`wallet:${userId}`)
    res.json({ success: true, data: { wallet: updatedWallet, transaction: tx } })
  } catch (err) { next(err) }
})

router.post('/wallet/refund', validate(z.object({ orderId: z.string().uuid(), amount: z.number().positive(), reason: z.string() })), async (req, res: Response, next: NextFunction) => {
  try {
    const { orderId, amount, reason } = req.body
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { user: true } })
    if (!order) return next(Errors.NotFound('Order not found'))
    const wallet = await prisma.wallet.findUnique({ where: { userId: order.userId } })
    if (!wallet) return next(Errors.NotFound('Wallet not found'))
    const newBalance = Number(wallet.balance) + amount
    await prisma.$transaction([
      prisma.wallet.update({ where: { id: wallet.id }, data: { balance: newBalance } }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id, orderId, type: 'REFUND', status: 'SUCCESS',
          amount, balanceBefore: Number(wallet.balance), balanceAfter: newBalance,
          description: `Admin refund: ${reason}`,
        },
      }),
    ])
    await delCache(`wallet:${order.userId}`)
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ─── BANNERS ADMIN ────────────────────────────────────────

const bannerSchema = z.object({
  title: z.string().min(1),
  imageUrl: z.string().url(),
  deepLink: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
})

router.get('/banners', async (_req, res: Response, next: NextFunction) => {
  try {
    const banners = await prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } })
    res.json({ success: true, data: { banners } })
  } catch (err) { next(err) }
})
router.post('/banners', validate(bannerSchema), async (req, res: Response, next: NextFunction) => {
  try {
    const banner = await prisma.banner.create({ data: req.body })
    res.status(201).json({ success: true, data: { banner } })
  } catch (err) { next(err) }
})
router.put('/banners/:id', validate(bannerSchema.partial()), async (req, res: Response, next: NextFunction) => {
  try {
    const banner = await prisma.banner.update({ where: { id: req.params.id }, data: req.body })
    res.json({ success: true, data: { banner } })
  } catch (err) { next(err) }
})
router.delete('/banners/:id', async (req, res: Response, next: NextFunction) => {
  try {
    await prisma.banner.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

export default router
