import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Auth token management
export function setAuthToken(token: string) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  if (typeof window !== 'undefined') localStorage.setItem('admin_token', token)
}

export function clearAuthToken() {
  delete api.defaults.headers.common['Authorization']
  if (typeof window !== 'undefined') localStorage.removeItem('admin_token')
}

export function loadStoredToken() {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token')
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    return token
  }
  return null
}
