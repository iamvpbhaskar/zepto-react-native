import type { OrderStatus } from '@zepto/types'

// ─── PRICING ─────────────────────────────────────────────

export const FREE_DELIVERY_THRESHOLD = 99  // ₹99 and above = free delivery
export const DELIVERY_FEE = 30              // ₹30 delivery fee below threshold
export const WALLET_MIN_TOPUP = 10          // ₹10 minimum wallet top-up
export const WALLET_MAX_TOPUP = 10000       // ₹10,000 maximum wallet top-up

// ─── AUTH ────────────────────────────────────────────────

export const OTP_EXPIRY_SECONDS = 60
export const OTP_DEV = '123456'             // Mock OTP for development
export const REFRESH_TOKEN_EXPIRY_DAYS = 7
export const ACCESS_TOKEN_EXPIRY_MINUTES = 15

// ─── PAGINATION ──────────────────────────────────────────

export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT = 20
export const MAX_LIMIT = 50

// ─── CACHE TTL (seconds) ─────────────────────────────────

export const CACHE_TTL_FEATURED_PRODUCTS = 300   // 5 min
export const CACHE_TTL_CATEGORIES = 600          // 10 min
export const CACHE_TTL_WALLET = 30               // 30 sec

// ─── ORDER STATUS FLOW ───────────────────────────────────

export const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKED', 'CANCELLED'],
  PACKED: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
}

export const CANCELLABLE_STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED']

// ─── ORDER STATUS LABELS ─────────────────────────────────

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Order Placed',
  CONFIRMED: 'Order Confirmed',
  PACKED: 'Packed',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: '#F59E0B',
  CONFIRMED: '#3B82F6',
  PACKED: '#8B5CF6',
  OUT_FOR_DELIVERY: '#F97316',
  DELIVERED: '#10B981',
  CANCELLED: '#EF4444',
  REFUNDED: '#6B7280',
}

// ─── APP ─────────────────────────────────────────────────

export const APP_NAME = 'Zepto'
export const APP_TAGLINE = '10-minute grocery delivery'
export const SEARCH_DEBOUNCE_MS = 300
export const RECENTLY_VIEWED_LIMIT = 10
