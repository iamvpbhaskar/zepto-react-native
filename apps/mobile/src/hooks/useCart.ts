import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import { queryClient } from '../lib/queryClient'
import { useCartStore } from '../features/cart/store/cart.store'
import type { CartItem, CartSummary, Product } from '@zepto/types'

interface CartResponse {
  cart: { id: string; items: CartItem[] }
  summary: CartSummary
}

// ─── FETCH CART ──────────────────────────────────────────

export function useCart() {
  const setCart = useCartStore(s => s.setCart)
  return useQuery<CartResponse>({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await api.get('/cart')
      const { cart, summary } = res.data.data
      setCart(cart.items ?? [], summary)
      return res.data.data
    },
    staleTime: 1000 * 120, // 120s
  })
}

// ─── ADD TO CART ─────────────────────────────────────────

export function useAddToCart() {
  const { optimisticAddItem, setCart } = useCartStore()

  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number; product?: Product }) =>
      api.post('/cart/items', { productId, quantity }).then(r => r.data.data),

    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] })
      const prev = queryClient.getQueryData(['cart'])
      
      // Dynamic optimistic update: use passed product, or check cache
      let product = vars.product
      if (!product) {
        product = queryClient.getQueryData<any>(['product', vars.productId])
      }
      if (!product) {
        // Fallback: search products in list queries
        const queriesData = queryClient.getQueriesData<any>({ queryKey: ['products'] })
        for (const [_, data] of queriesData) {
          const list = Array.isArray(data) ? data : (data?.products || data?.data || [])
          const found = list.find((p: any) => p.id === vars.productId)
          if (found) {
            product = found
            break
          }
        }
      }
      
      if (product) {
        optimisticAddItem(product, vars.quantity)
      }
      return { prev }
    },

    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(['cart'], context.prev)
    },

    onSettled: (data) => {
      if (data) setCart(data.cart.items, data.summary)
    },
  })
}

// ─── UPDATE QUANTITY ─────────────────────────────────────

export function useUpdateCartItem() {
  const { optimisticUpdateQuantity, setCart } = useCartStore()

  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      api.put(`/cart/items/${productId}`, { quantity }).then(r => r.data.data),

    onMutate: async ({ productId, quantity }) => {
      const prev = queryClient.getQueryData(['cart'])
      optimisticUpdateQuantity(productId, quantity)
      return { prev }
    },

    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(['cart'], context.prev)
    },

    onSettled: (data) => {
      if (data) setCart(data.cart.items, data.summary)
    },
  })
}

// ─── REMOVE ITEM ─────────────────────────────────────────

export function useRemoveCartItem() {
  const { optimisticRemoveItem, setCart } = useCartStore()

  return useMutation({
    mutationFn: (productId: string) =>
      api.delete(`/cart/items/${productId}`).then(r => r.data.data),

    onMutate: async (productId) => {
      const prev = queryClient.getQueryData(['cart'])
      optimisticRemoveItem(productId)
      return { prev }
    },

    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(['cart'], context.prev)
    },

    onSettled: (data) => {
      if (data) setCart(data.cart.items, data.summary)
    },
  })
}

// ─── VALIDATE COUPON ─────────────────────────────────────

export function useValidateCoupon() {
  return useMutation({
    mutationFn: (code: string) =>
      api.post('/cart/validate-coupon', { code }).then(r => r.data.data),
  })
}

// ─── CLEAR CART ──────────────────────────────────────────

export function useClearCart() {
  const { setCart } = useCartStore()

  return useMutation({
    mutationFn: () =>
      api.delete('/cart/clear').then(r => r.data.data),

    onMutate: async () => {
      const prev = queryClient.getQueryData(['cart'])
      setCart([], {
        subtotal: 0,
        deliveryFee: 0,
        discount: 0,
        total: 0,
        itemCount: 0,
        isFreeDelivery: false,
        freeDeliveryThreshold: 0
      })
      return { prev }
    },

    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(['cart'], context.prev)
    },

    onSettled: (data) => {
      if (data) setCart(data.cart?.items ?? [], data.summary)
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}
