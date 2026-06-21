import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Product } from '@zepto/types'

interface ProductListResponse {
  products: Product[]
  total: number
  page: number
  totalPages: number
  hasMore: boolean
}

// ─── LIST PRODUCTS ───────────────────────────────────────

export function useProducts(params: {
  categoryId?: string
  featured?: boolean
  search?: string
  page?: number
  limit?: number
  sort?: string
}) {
  return useQuery<ProductListResponse>({
    queryKey: ['products', params],
    queryFn: () => {
      const query = new URLSearchParams()
      if (params.categoryId) query.set('categoryId', params.categoryId)
      if (params.featured !== undefined) query.set('featured', String(params.featured))
      if (params.search) query.set('search', params.search)
      if (params.page) query.set('page', String(params.page))
      if (params.limit) query.set('limit', String(params.limit))
      if (params.sort) query.set('sort', params.sort)
      return api.get(`/products?${query}`).then(r => r.data.data)
    },
  })
}

// ─── CATEGORY PRODUCTS ───────────────────────────────────

export function useCategoryProducts(slug: string, params: {
  page?: number
  limit?: number
  sort?: string
} = {}) {
  return useQuery<{
    category: any
    products: Product[]
    total: number
    page: number
    totalPages: number
    hasMore: boolean
  }>({
    queryKey: ['category-products', slug, params],
    queryFn: () => {
      const query = new URLSearchParams()
      if (params.page) query.set('page', String(params.page))
      if (params.limit) query.set('limit', String(params.limit))
      if (params.sort) query.set('sort', params.sort)
      return api.get(`/categories/${slug}?${query}`).then(r => r.data.data)
    },
    enabled: !!slug,
  })
}


// ─── FEATURED PRODUCTS ───────────────────────────────────

export function useFeaturedProducts() {
  return useQuery<{ products: Product[] }>({
    queryKey: ['products', 'featured'],
    queryFn: () => api.get('/products/featured').then(r => r.data.data),
    staleTime: 1000 * 60 * 5, // 5 min (matches server cache)
  })
}

// ─── POPULAR PRODUCTS ────────────────────────────────────

export function usePopularProducts() {
  return useQuery<{ products: Product[] }>({
    queryKey: ['products', 'popular'],
    queryFn: () => api.get('/products/popular').then(r => r.data.data),
  })
}

// ─── SEARCH PRODUCTS (debounced at component level) ──────

export function useSearchProducts(q: string) {
  return useQuery<{ products: Product[]; suggestions: string[] }>({
    queryKey: ['search', q],
    queryFn: () => api.get(`/products/search?q=${encodeURIComponent(q)}&limit=15`).then(r => r.data.data),
    enabled: q.trim().length >= 2,
    staleTime: 1000 * 60, // 1 min
  })
}

// ─── SINGLE PRODUCT ──────────────────────────────────────

export function useProduct(slug: string) {
  return useQuery<{ product: Product; relatedProducts: Product[] }>({
    queryKey: ['product', slug],
    queryFn: () => api.get(`/products/${slug}`).then(r => r.data.data),
    enabled: !!slug,
  })
}

// ─── RECENTLY VIEWED ─────────────────────────────────────

export function useRecentlyViewed() {
  return useQuery<{ products: Product[] }>({
    queryKey: ['products', 'recently-viewed'],
    queryFn: () => api.get('/products/recently-viewed').then(r => r.data.data),
  })
}
