import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { User, Tokens } from '@zepto/types'
import { storage } from '../../../lib/storage'

interface AuthStore {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: User, tokens: Tokens) => Promise<void>
  logout: () => Promise<void>
  updateUser: (user: Partial<User>) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (user, tokens) => {
        await storage.setTokens(tokens.accessToken, tokens.refreshToken)
        set({ user, accessToken: tokens.accessToken, isAuthenticated: true })
      },

      logout: async () => {
        await storage.clearTokens()
        set({ user: null, accessToken: null, isAuthenticated: false })
      },

      updateUser: (updatedUser) =>
        set({ user: get().user ? { ...get().user!, ...updatedUser } : null }),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'zepto-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
