import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import { queryClient } from '../lib/queryClient'
import type { Wallet, WalletTransaction } from '@zepto/types'

// ─── WALLET BALANCE ──────────────────────────────────────

export function useWallet() {
  return useQuery<{ wallet: Wallet }>({
    queryKey: ['wallet'],
    queryFn: () => api.get('/wallet').then(r => r.data.data),
    staleTime: 1000 * 30, // 30s (matches server cache TTL)
  })
}

// ─── TRANSACTIONS ────────────────────────────────────────

export function useWalletTransactions(params: { page?: number; type?: string } = {}) {
  return useQuery<{ transactions: WalletTransaction[]; total: number; page: number }>({
    queryKey: ['wallet', 'transactions', params],
    queryFn: () => {
      const query = new URLSearchParams()
      if (params.page) query.set('page', String(params.page))
      if (params.type) query.set('type', params.type)
      return api.get(`/wallet/transactions?${query}`).then(r => r.data.data)
    },
  })
}

// ─── ADD MONEY ───────────────────────────────────────────

export function useAddMoney() {
  return useMutation({
    mutationFn: (amount: number) =>
      api.post('/wallet/add-money', { amount }).then(r => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
    },
  })
}
