import { useQuery, useMutation } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { api } from '../lib/api'
import { queryClient } from '../lib/queryClient'
import { useCartStore } from '../features/cart/store/cart.store'
import type { Order } from '@zepto/types'

interface OrdersResponse {
  orders: Order[]
  total: number
  page: number
  totalPages: number
  hasMore: boolean
}

// ─── LIST ORDERS ─────────────────────────────────────────

export function useOrders(params: { page?: number; status?: string } = {}) {
  return useQuery<OrdersResponse>({
    queryKey: ['orders', params],
    queryFn: () => {
      const query = new URLSearchParams()
      if (params.page) query.set('page', String(params.page))
      if (params.status) query.set('status', params.status)
      return api.get(`/orders?${query}`).then(r => r.data.data)
    },
  })
}

// ─── SINGLE ORDER ────────────────────────────────────────

export function useOrder(id: string) {
  return useQuery<{ order: Order }>({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}`).then(r => r.data.data),
    enabled: !!id,
  })
}

// ─── PLACE ORDER ─────────────────────────────────────────

export function usePlaceOrder() {
  const clearCart = useCartStore(s => s.clearCart)
  const router = useRouter()

  return useMutation({
    mutationFn: (data: {
      addressId: string
      paymentMethod: 'WALLET' | 'COD'
      couponCode?: string
      notes?: string
    }) => api.post('/orders', data).then(r => r.data.data),

    onSuccess: (data) => {
      clearCart()
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      router.replace(`/(tabs)/orders/${data.order.id}?success=true`)
    },
  })
}

// ─── CANCEL ORDER ────────────────────────────────────────

export function useCancelOrder() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.put(`/orders/${id}/cancel`, { reason }).then(r => r.data.data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['order', vars.id] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
    },
  })
}

// ─── REORDER ─────────────────────────────────────────────

export function useReorder() {
  const router = useRouter()
  return useMutation({
    mutationFn: (orderId: string) =>
      api.post(`/orders/${orderId}/reorder`).then(r => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      router.push('/(tabs)/cart')
    },
  })
}
