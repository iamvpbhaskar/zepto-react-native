import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from '@zepto/config'
import type { CartItem, CartSummary } from '@zepto/types'

// ─── CURRENCY ────────────────────────────────────────────

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

// ─── DATES ───────────────────────────────────────────────

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function timeAgo(date: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ─── CART PRICING ────────────────────────────────────────

export function calcSubtotal(items: CartItem[]): number {
  return items.reduce((acc, item) => acc + item.product.price * item.quantity, 0)
}

export function calcDeliveryFee(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
}

export function calcDiscount(
  couponType: 'FLAT' | 'PERCENT',
  couponValue: number,
  subtotal: number,
  maxDiscount?: number
): number {
  let discount: number
  if (couponType === 'FLAT') {
    discount = couponValue
  } else {
    discount = Math.round((subtotal * couponValue) / 100)
  }
  if (maxDiscount) discount = Math.min(discount, maxDiscount)
  return Math.min(discount, subtotal)
}

export function calcCartSummary(items: CartItem[], couponDiscount = 0): CartSummary {
  const subtotal = calcSubtotal(items)
  const deliveryFee = calcDeliveryFee(subtotal)
  const discount = couponDiscount
  const total = subtotal + deliveryFee - discount
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0)

  return {
    subtotal,
    deliveryFee,
    discount,
    total: Math.max(0, total),
    itemCount,
    isFreeDelivery: subtotal >= FREE_DELIVERY_THRESHOLD,
    freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
  }
}

// ─── PRODUCT ─────────────────────────────────────────────

export function calcDiscountPercent(mrp: number, price: number): number {
  if (!mrp || mrp <= price) return 0
  return Math.round(((mrp - price) / mrp) * 100)
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// ─── ORDER ───────────────────────────────────────────────

export function generateOrderNumber(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, '0')
  return `ZPT-${dateStr}-${random}`
}

// ─── VALIDATION ──────────────────────────────────────────

export function isValidPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone)
}

export function isValidPincode(pincode: string): boolean {
  return /^\d{6}$/.test(pincode)
}

// ─── PAGINATION ──────────────────────────────────────────

export function getPaginationMeta(total: number, page: number, limit: number) {
  const totalPages = Math.ceil(total / limit)
  return {
    total,
    page,
    totalPages,
    hasMore: page < totalPages,
  }
}
