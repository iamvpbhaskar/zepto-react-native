import { describe, it, expect } from 'vitest'
import { calcCartSummary, calcDiscountPercent, generateOrderNumber } from '@zepto/utils'
import { FREE_DELIVERY_THRESHOLD, DELIVERY_FEE } from '@zepto/config'

const makeItem = (price: number, qty: number) => ({
  id: 'item-1',
  cartId: 'cart-1',
  productId: 'prod-1',
  quantity: qty,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  product: {
    id: 'prod-1',
    price,
    mrp: price * 1.2,
    name: 'Test',
    slug: 'test',
    categoryId: 'cat-1',
    images: [],
    unit: '1pc',
    stock: 100,
    isActive: true,
    isFeatured: false,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
} as any)

describe('Cart Pricing', () => {
  it('should charge delivery fee below threshold', () => {
    const items = [makeItem(100, 1)]
    const summary = calcCartSummary(items)
    expect(summary.subtotal).toBe(100)
    expect(summary.deliveryFee).toBe(DELIVERY_FEE)
    expect(summary.isFreeDelivery).toBe(false)
    expect(summary.total).toBe(100 + DELIVERY_FEE)
  })

  it('should give free delivery at threshold', () => {
    const items = [makeItem(FREE_DELIVERY_THRESHOLD, 1)]
    const summary = calcCartSummary(items)
    expect(summary.deliveryFee).toBe(0)
    expect(summary.isFreeDelivery).toBe(true)
    expect(summary.total).toBe(FREE_DELIVERY_THRESHOLD)
  })

  it('should give free delivery above threshold', () => {
    const items = [makeItem(100, 2)]
    const summary = calcCartSummary(items)
    expect(summary.subtotal).toBe(200)
    expect(summary.deliveryFee).toBe(0)
  })

  it('should apply coupon discount', () => {
    const items = [makeItem(200, 1)]
    const summary = calcCartSummary(items, 50)
    expect(summary.subtotal).toBe(200)
    expect(summary.discount).toBe(50)
    expect(summary.total).toBe(150)
  })

  it('should count items correctly', () => {
    const items = [makeItem(50, 3), makeItem(80, 2)]
    const summary = calcCartSummary(items)
    expect(summary.itemCount).toBe(5)
  })
})

describe('Discount Percent', () => {
  it('should calculate discount percent', () => {
    expect(calcDiscountPercent(100, 80)).toBe(20)
    expect(calcDiscountPercent(500, 399)).toBe(20)
  })

  it('should return 0 when no discount', () => {
    expect(calcDiscountPercent(100, 100)).toBe(0)
    expect(calcDiscountPercent(100, 110)).toBe(0)
  })
})

describe('Order Number', () => {
  it('should generate a valid order number', () => {
    const num = generateOrderNumber()
    expect(num).toMatch(/^ZPT-\d{8}-\d{4}$/)
  })

  it('should generate unique order numbers', () => {
    const nums = new Set(Array.from({ length: 100 }, generateOrderNumber))
    expect(nums.size).toBeGreaterThan(50) // Probabilistic, should be mostly unique
  })
})
