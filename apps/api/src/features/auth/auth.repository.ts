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

  ensureWallet: (userId: string) =>
    prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId, balance: 0 },
    }),
}
