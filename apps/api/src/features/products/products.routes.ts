import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { authenticate, type AuthRequest } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validate.middleware'
import { Errors } from '../../middleware/error.middleware'
import { getCache, setCache } from '../../lib/redis'
import { CACHE_TTL_FEATURED_PRODUCTS, RECENTLY_VIEWED_LIMIT } from '@zepto/config'
import { getPaginationMeta, calcDiscountPercent } from '@zepto/utils'
import type { Request, Response, NextFunction } from 'express'
import type { Prisma } from '@prisma/client'

const router = Router()

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  categoryId: z.string().uuid().optional(),
  search: z.string().optional(),
  sort: z.enum(['price_asc', 'price_desc', 'popular', 'newest', 'discount']).optional(),
  featured: z.coerce.boolean().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
})

const searchQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().positive().max(20).default(10),
})

function addDiscountPercent(products: any[]) {
  return products.map(p => ({
    ...p,
    discountPercent: calcDiscountPercent(Number(p.mrp), Number(p.price)),
  }))
}

// GET /products
router.get('/', validate(listQuerySchema, 'query'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, categoryId, search, sort, featured, minPrice, maxPrice } =
      req.query as unknown as z.infer<typeof listQuerySchema>

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(categoryId ? { categoryId } : {}),
      ...(featured !== undefined ? { isFeatured: featured } : {}),
      ...(minPrice !== undefined ? { price: { gte: minPrice } } : {}),
      ...(maxPrice !== undefined ? { price: { ...(minPrice !== undefined ? { gte: minPrice } : {}), lte: maxPrice } } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === 'price_asc' ? { price: 'asc' }
      : sort === 'price_desc' ? { price: 'desc' }
      : sort === 'popular' ? { isFeatured: 'desc' }
      : sort === 'discount' ? { mrp: 'desc' }
      : { createdAt: 'desc' }

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit, include: { category: true } }),
      prisma.product.count({ where }),
    ])

    res.json({
      success: true,
      data: { products: addDiscountPercent(products), ...getPaginationMeta(total, page, limit) },
    })
  } catch (err) { next(err) }
})

// GET /products/search
router.get('/search', validate(searchQuerySchema, 'query'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, limit } = req.query as unknown as z.infer<typeof searchQuerySchema>
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { tags: { has: q.toLowerCase() } },
        ],
      },
      take: limit,
      include: { category: true },
    })
    const suggestions = [...new Set(products.map((p: any) => p.name).slice(0, 5))]
    res.json({ success: true, data: { products: addDiscountPercent(products), suggestions } })
  } catch (err) { next(err) }
})

// GET /products/featured
router.get('/featured', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheKey = 'products:featured'
    const cached = await getCache(cacheKey)
    if (cached) return res.json({ success: true, data: { products: cached } })

    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      include: { category: true },
    })
    const withDiscount = addDiscountPercent(products)
    await setCache(cacheKey, withDiscount, CACHE_TTL_FEATURED_PRODUCTS)
    res.json({ success: true, data: { products: withDiscount } })
  } catch (err) { next(err) }
})

// GET /products/popular
router.get('/popular', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: [{ isFeatured: 'desc' }, { updatedAt: 'desc' }],
      take: 20,
      include: { category: true },
    })
    res.json({ success: true, data: { products: addDiscountPercent(products) } })
  } catch (err) { next(err) }
})

// GET /products/recently-viewed
router.get('/recently-viewed', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const recentlyViewed = await prisma.recentlyViewed.findMany({
      where: { userId: req.user!.userId },
      orderBy: { viewedAt: 'desc' },
      take: RECENTLY_VIEWED_LIMIT,
      include: { product: { include: { category: true } } },
    })
    const products = addDiscountPercent(recentlyViewed.map((rv: any) => rv.product))
    res.json({ success: true, data: { products } })
  } catch (err) { next(err) }
})

// GET /products/:slug
router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug, isActive: true },
      include: { category: true },
    })
    if (!product) return next(Errors.NotFound('Product not found'))

    const relatedProducts = await prisma.product.findMany({
      where: { categoryId: product.categoryId, isActive: true, id: { not: product.id } },
      take: 8,
      include: { category: true },
    })

    res.json({
      success: true,
      data: {
        product: { ...product, discountPercent: calcDiscountPercent(Number(product.mrp), Number(product.price)) },
        relatedProducts: addDiscountPercent(relatedProducts),
      },
    })
  } catch (err) { next(err) }
})

// POST /products/:id/view
router.post('/:id/view', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!product) return next(Errors.NotFound('Product not found'))

    await prisma.recentlyViewed.upsert({
      where: { userId_productId: { userId: req.user!.userId, productId: product.id } },
      update: { viewedAt: new Date() },
      create: { userId: req.user!.userId, productId: product.id },
    })
    res.json({ success: true })
  } catch (err) { next(err) }
})

export default router
