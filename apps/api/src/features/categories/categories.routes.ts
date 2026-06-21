import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { validate } from '../../middleware/validate.middleware'
import { Errors } from '../../middleware/error.middleware'
import { getCache, setCache } from '../../lib/redis'
import { CACHE_TTL_CATEGORIES } from '@zepto/config'
import { getPaginationMeta } from '@zepto/utils'
import type { Request, Response, NextFunction } from 'express'

const router = Router()

const categoryProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  sort: z.enum(['price_asc', 'price_desc', 'popular', 'newest']).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
})

// GET /categories
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheKey = 'categories:all'
    const cached = await getCache(cacheKey)
    if (cached) return res.json({ success: true, data: { categories: cached } })

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    })

    await setCache(cacheKey, categories, CACHE_TTL_CATEGORIES)
    res.json({ success: true, data: { categories } })
  } catch (err) { next(err) }
})

// GET /categories/:slug
router.get('/:slug', validate(categoryProductsQuerySchema, 'query'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, sort, minPrice, maxPrice } = req.query as unknown as z.infer<typeof categoryProductsQuerySchema>

    const category = await prisma.category.findUnique({ where: { slug: req.params.slug, isActive: true } })
    if (!category) return next(Errors.NotFound('Category not found'))

    const orderBy: Record<string, 'asc' | 'desc'>[] = sort === 'price_asc'
      ? [{ price: 'asc' }]
      : sort === 'price_desc'
      ? [{ price: 'desc' }]
      : sort === 'popular'
      ? [{ isFeatured: 'desc' }]
      : [{ createdAt: 'desc' }]

    const where = {
      categoryId: category.id,
      isActive: true,
      ...(minPrice !== undefined ? { price: { gte: minPrice } } : {}),
      ...(maxPrice !== undefined ? { price: { lte: maxPrice } } : {}),
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    res.json({
      success: true,
      data: {
        category,
        products,
        ...getPaginationMeta(total, page, limit),
      },
    })
  } catch (err) { next(err) }
})

export default router
