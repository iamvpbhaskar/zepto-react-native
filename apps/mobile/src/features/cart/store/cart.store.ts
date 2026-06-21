import { create } from 'zustand'
import type { CartItem, CartSummary, Product } from '@zepto/types'

interface CartStore {
  items: CartItem[]
  summary: CartSummary | null
  itemCount: number

  setCart: (items: CartItem[], summary: CartSummary) => void
  clearCart: () => void

  // Optimistic update helpers
  optimisticAddItem: (product: Product, quantity: number) => void
  optimisticUpdateQuantity: (productId: string, quantity: number) => void
  optimisticRemoveItem: (productId: string) => void

  getItemQuantity: (productId: string) => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  summary: null,
  itemCount: 0,

  setCart: (items, summary) =>
    set({ items, summary, itemCount: summary.itemCount }),

  clearCart: () =>
    set({ items: [], summary: null, itemCount: 0 }),

  optimisticAddItem: (product, quantity) => {
    const { items } = get()
    const existing = items.find(i => i.productId === product.id)
    let newItems: CartItem[]
    if (existing) {
      newItems = items.map(i =>
        i.productId === product.id
          ? { ...i, quantity: i.quantity + quantity }
          : i
      )
    } else {
      newItems = [...items, {
        id: `temp-${product.id}`,
        cartId: 'temp',
        productId: product.id,
        product,
        quantity,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }]
    }
    const itemCount = newItems.reduce((acc, i) => acc + i.quantity, 0)
    set({ items: newItems, itemCount })
  },

  optimisticUpdateQuantity: (productId, quantity) => {
    const { items } = get()
    const newItems = quantity === 0
      ? items.filter(i => i.productId !== productId)
      : items.map(i => i.productId === productId ? { ...i, quantity } : i)
    const itemCount = newItems.reduce((acc, i) => acc + i.quantity, 0)
    set({ items: newItems, itemCount })
  },

  optimisticRemoveItem: (productId) => {
    const { items } = get()
    const newItems = items.filter(i => i.productId !== productId)
    const itemCount = newItems.reduce((acc, i) => acc + i.quantity, 0)
    set({ items: newItems, itemCount })
  },

  getItemQuantity: (productId) => {
    const item = get().items.find(i => i.productId === productId)
    return item?.quantity ?? 0
  },
}))
