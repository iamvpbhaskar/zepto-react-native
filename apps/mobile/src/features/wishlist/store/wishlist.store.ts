import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Product } from '@zepto/types'

interface WishlistStore {
  items: Product[]
  toggleItem: (product: Product) => void
  isLiked: (productId: string) => boolean
  clearWishlist: () => void
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      toggleItem: (product) => {
        const { items } = get()
        const exists = items.some(i => i.id === product.id)
        if (exists) {
          set({ items: items.filter(i => i.id !== product.id) })
        } else {
          set({ items: [...items, product] })
        }
      },
      isLiked: (productId) => {
        return get().items.some(i => i.id === productId)
      },
      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'wishlist-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
