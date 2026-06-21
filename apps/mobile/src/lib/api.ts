import axios from 'axios'
import { storage } from './storage'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Request interceptor — attach access token
api.interceptors.request.use(async (config) => {
  const token = await storage.getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor — handle 401 token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshToken = await storage.getRefreshToken()
        if (!refreshToken) throw new Error('No refresh token')
        const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken })
        const { accessToken, refreshToken: newRefresh } = res.data.data
        await storage.setTokens(accessToken, newRefresh)
        original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch {
        await storage.clearTokens()
        // Navigate to login — handled by AuthNavigator
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)
