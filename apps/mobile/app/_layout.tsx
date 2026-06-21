import React, { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '../src/lib/queryClient'
import { useAuthStore } from '../src/features/auth/store/auth.store'
import { storage } from '../src/lib/storage'
import { colors } from '../src/theme'
import Toast from 'react-native-toast-message'
import { toastConfig } from '../src/components/ui/WishlistToast'

export default function RootLayout() {
  const { setLoading, login, logout, isLoading } = useAuthStore()

  // Initialize auth state from SecureStore/AsyncStorage
  useEffect(() => {
    async function initAuth() {
      try {
        const accessToken = await storage.getAccessToken()
        const refreshToken = await storage.getRefreshToken()
        
        if (accessToken && refreshToken) {
          // Fetch current user from API to verify token
          const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'}/users/me`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          })
          if (res.ok) {
            const data = await res.json()
            await login(data.data.user, { accessToken, refreshToken })
          } else {
            await logout()
          }
        } else {
          await logout()
        }
      } catch (err) {
        console.error('Auth initialization failed', err)
        await logout()
      } finally {
        setLoading(false)
      }
    }
    initAuth()
  }, [])

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="product/[slug]" options={{ headerShown: false }} />
        <Stack.Screen name="category/[slug]" options={{ headerShown: false }} />
        <Stack.Screen name="products" options={{ title: 'Featured Products' }} />
        <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
        <Stack.Screen name="addresses/index" options={{ title: 'My Addresses' }} />
        <Stack.Screen name="addresses/new" options={{ title: 'New Address' }} />
      </Stack>
      <StatusBar style="auto" />
      <Toast config={toastConfig} />
    </QueryClientProvider>
  )
}
