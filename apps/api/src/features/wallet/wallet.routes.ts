import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { authenticate, type AuthRequest } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validate.middleware'
import { Errors } from '../../middleware/error.middleware'
import { getCache, setCache, delCache } from '../../lib/redis'
import { WALLET_MIN_TOPUP, WALLET_MAX_TOPUP, CACHE_TTL_WALLET } from '@zepto/config'
import { getPaginationMeta } from '@zepto/utils'
import type { Response, NextFunction } from 'express'
import type { Prisma } from '@prisma/client'

const router = Router()

const addMoneySchema = z.object({
  amount: z
    .number()
    .int()
    .min(WALLET_MIN_TOPUP, `Minimum top-up is ₹${WALLET_MIN_TOPUP}`)
    .max(WALLET_MAX_TOPUP, `Maximum top-up is ₹${WALLET_MAX_TOPUP}`),
})

const txQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  type: z.enum(['CREDIT', 'DEBIT', 'REFUND']).optional(),
})

// GET /wallet
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const cacheKey = `wallet:${userId}`
    const cached = await getCache(cacheKey)
    if (cached) return res.json({ success: true, data: { wallet: cached } })

    const wallet = await prisma.wallet.findUnique({ where: { userId } })
    if (!wallet) return next(Errors.NotFound('Wallet not found'))

    await setCache(cacheKey, wallet, CACHE_TTL_WALLET)
    res.json({ success: true, data: { wallet } })
  } catch (err) { next(err) }
})

// GET /wallet/transactions
router.get('/transactions', authenticate, validate(txQuerySchema, 'query'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page, limit, type } = req.query as unknown as z.infer<typeof txQuerySchema>
    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.userId } })
    if (!wallet) return next(Errors.NotFound('Wallet not found'))

    const where: Prisma.WalletTransactionWhereInput = {
      walletId: wallet.id,
      ...(type ? { type } : {}),
    }

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.walletTransaction.count({ where }),
    ])

    res.json({ success: true, data: { transactions, ...getPaginationMeta(total, page, limit) } })
  } catch (err) { next(err) }
})

// POST /wallet/add-money — Mock payment gateway
router.post('/add-money', authenticate, validate(addMoneySchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { amount } = req.body
    const userId = req.user!.userId

    const wallet = await prisma.wallet.findUnique({ where: { userId } })
    if (!wallet) return next(Errors.NotFound('Wallet not found'))

    // 1. Create PENDING transaction
    const pendingTx = await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'CREDIT',
        status: 'PENDING',
        amount,
        balanceBefore: Number(wallet.balance),
        balanceAfter: Number(wallet.balance) + amount,
        description: `Wallet top-up of ₹${amount}`,
        reference: `PAY_${Date.now()}`,
      },
    })

    // 2. Simulate gateway (500ms delay → SUCCESS)
    await new Promise((resolve) => setTimeout(resolve, 500))

    // 3. Update wallet balance + mark transaction SUCCESS
    const [updatedWallet, updatedTx] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: Number(wallet.balance) + amount },
      }),
      prisma.walletTransaction.update({
        where: { id: pendingTx.id },
        data: { status: 'SUCCESS' },
      }),
    ])

    // 4. Notification
    await prisma.notification.create({
      data: {
        userId,
        title: 'Wallet Credited 💰',
        body: `₹${amount} has been added to your wallet`,
        type: 'WALLET',
        data: { transactionId: updatedTx.id },
      },
    })

    // Invalidate cache
    await delCache(`wallet:${userId}`)

    res.json({ success: true, data: { transaction: updatedTx, wallet: updatedWallet } })
  } catch (err) { next(err) }
})

export default router
