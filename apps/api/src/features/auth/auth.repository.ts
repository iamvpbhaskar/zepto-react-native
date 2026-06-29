import { prisma } from '../../lib/prisma'
import type { User } from '@prisma/client'

export const authRepository = {
  findByPhone: (phone: string): Promise<User | null> =>
    prisma.user.findUnique({ where: { phone } }),

  findById: (id: string): Promise<User | null> =>
    prisma.user.findUnique({ where: { id } }),

  upsertUser: (phone: string): Promise<User> =>
    prisma.user.upsert({
      where: { phone },
      update: { isVerified: true },
      create: { phone, isVerified: true },
    }),

  saveRefreshToken: (userId: string, refreshToken: string): Promise<User> =>
    prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    }),

  clearRefreshToken: (userId: string): Promise<User> =>
    prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    }),

  ensureWallet: async (userId: string) => {
    // Check if wallet already exists
    const existing = await prisma.wallet.findUnique({ where: { userId } })
    if (existing) return existing

    // New user — create wallet with ₹500 welcome bonus atomically
    const WELCOME_BONUS = 500
    return prisma.$transaction(async (tx: any) => {
      const wallet = await tx.wallet.create({
        data: { userId, balance: WELCOME_BONUS },
      })
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'CREDIT',
          status: 'SUCCESS',
          amount: WELCOME_BONUS,
          balanceBefore: 0,
          balanceAfter: WELCOME_BONUS,
          description: 'Welcome bonus 🎉',
          reference: 'WELCOME_BONUS',
        },
      })
      // Send welcome notification
      await tx.notification.create({
        data: {
          userId,
          title: 'Welcome to Zepto Wallet! 🎉',
          body: `₹${WELCOME_BONUS} welcome bonus has been credited to your wallet. Happy shopping!`,
          type: 'WALLET',
          data: { bonus: WELCOME_BONUS },
        },
      })
      return wallet
    })
  },
}
