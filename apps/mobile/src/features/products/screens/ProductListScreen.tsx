import React, { useState, useMemo } from 'react'
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ScrollView
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useProducts, useCategoryProducts } from '../../../hooks/useProducts'
import { useCartStore } from '../../cart/store/cart.store'
import { ProductSkeleton } from '../../../components/ui/Skeleton'
import { colors, fontSize, spacing, radius } from '../../../theme'
import { ProductCard } from '../components/ProductCard'
import { ShoppingCart, Heart, Search, ChevronLeft, ArrowUpDown } from 'lucide-react-native'
import type { Product } from '@zepto/types'

const SUBCATEGORIES_CONFIG: Record<string, { name: string; tag: string | null; icon: string }[]> = {
  'fruits-vegetables': [
    { name: 'All', tag: null, icon: 'https://cdn-icons-png.flaticon.com/512/1625/1625048.png' },
    { name: 'Fresh Vegetables', tag: 'vegetable', icon: 'https://cdn-icons-png.flaticon.com/512/2329/2329903.png' },
    { name: 'New Launches', tag: 'organic', icon: 'https://cdn-icons-png.flaticon.com/512/614/614131.png' },
    { name: 'Fresh Fruits', tag: 'fruit', icon: 'https://cdn-icons-png.flaticon.com/512/3194/3194591.png' },
    { name: 'Exotics & Premium', tag: 'salad', icon: 'https://cdn-icons-png.flaticon.com/512/2909/2909772.png' },
    { name: 'Mangoes & Melons', tag: 'fresh', icon: 'https://cdn-icons-png.flaticon.com/512/2909/2909808.png' },
  ],
  'dairy-bread-eggs': [
    { name: 'All', tag: null, icon: 'https://cdn-icons-png.flaticon.com/512/1625/1625048.png' },
    { name: 'Milk & Cream', tag: 'milk', icon: 'https://cdn-icons-png.flaticon.com/512/3022/3022221.png' },
    { name: 'Bread & Pav', tag: 'bread', icon: 'https://cdn-icons-png.flaticon.com/512/1037/1037857.png' },
    { name: 'Butter & Cheese', tag: 'butter', icon: 'https://cdn-icons-png.flaticon.com/512/8265/8265147.png' },
    { name: 'Eggs', tag: 'eggs', icon: 'https://cdn-icons-png.flaticon.com/512/2713/2713436.png' },
  ],
  'default': [
    { name: 'All', tag: null, icon: 'https://cdn-icons-png.flaticon.com/512/1625/1625048.png' },
    { name: 'Fresh Items', tag: 'fresh', icon: 'https://cdn-icons-png.flaticon.com/512/2913/2913604.png' },
    { name: 'Featured', tag: 'featured', icon: 'https://cdn-icons-png.flaticon.com/512/3194/3194591.png' },
  ]
}

export default function ProductListScreen() {
  const { slug, featured } = useLocalSearchParams<{ slug?: string; featured?: string }>()
  const router = useRouter()
  const [sort, setSort] = useState<'price_asc' | 'price_desc' | 'popular' | 'newest'>('popular')
  const [selectedSub, setSelectedSub] = useState<string>('All')
  
  const itemCount = useCartStore(s => s.itemCount)

  // Fetch either category products or all products
  const categoryQuery = useCategoryProducts(slug ?? '', { sort })
  const productsQuery = useProducts({
    featured: featured === 'true' ? true : undefined,
    sort,
  })

  const isLoading = slug ? categoryQuery.isLoading : productsQuery.isLoading
  const rawProducts = slug ? categoryQuery.data?.products : productsQuery.data?.products
  const categoryName = slug 
    ? categoryQuery.data?.category?.name ?? 'Category'
    : featured === 'true'
      ? 'Featured Products'
      : 'All Products'

  // Get active subcategories configuration
  const subConfig = useMemo(() => {
    return SUBCATEGORIES_CONFIG[slug || ''] || SUBCATEGORIES_CONFIG['default']
  }, [slug])

  // Filter products based on selected subcategory tag
  const products = useMemo(() => {
    if (!rawProducts) return []
    if (selectedSub === 'All') return rawProducts
    const currentSub = subConfig.find(s => s.name === selectedSub)
    if (!currentSub || !currentSub.tag) return rawProducts
    return rawProducts.filter(p => p.tags?.includes(currentSub.tag!))
  }, [rawProducts, selectedSub, subConfig])

  const toggleSort = () => {
    const options: typeof sort[] = ['popular', 'price_asc', 'price_desc', 'newest']
    const nextIndex = (options.indexOf(sort) + 1) % options.length
    setSort(options[nextIndex])
  }

  const getSortLabel = () => {
    switch (sort) {
      case 'price_asc': return 'Price: Low to High'
      case 'price_desc': return 'Price: High to Low'
      case 'newest': return 'Newest Arrivals'
      default: return 'Popularity'
    }
  }

  const renderProductCard = ({ item: product }: { item: Product }) => (
    <View style={styles.gridCardContainer}>
      <ProductCard product={product} />
    </View>
  )

  return (
    <View style={styles.container}>
      {/* Custom Premium Header matching Zepto aesthetics */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryName}</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push('/(tabs)/wishlist')}>
            <Heart size={22} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push('/search')}>
            <Search size={22} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Body with Sidebar + Grid */}
      <View style={styles.bodyRow}>
        {/* Subcategories Sidebar */}
        <View style={styles.sidebar}>
          <ScrollView contentContainerStyle={styles.sidebarContent} showsVerticalScrollIndicator={false}>
            {subConfig.map((sub, idx) => {
              const isActive = selectedSub === sub.name
              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.sidebarItem}
                  onPress={() => setSelectedSub(sub.name)}
                >
                  <View style={[styles.sidebarIconWrapper, isActive && styles.sidebarIconWrapperActive]}>
                    <Image source={{ uri: sub.icon }} style={styles.sidebarIcon} resizeMode="contain" />
                  </View>
                  <Text style={[styles.sidebarItemText, isActive && styles.sidebarItemTextActive]}>
                    {sub.name}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>

        {/* Product Grid Area */}
        <View style={styles.mainContent}>
          {/* Filter Toolbar */}
          <View style={styles.toolbar}>
            <Text style={styles.toolbarTitle}>
              {products.length} {products.length === 1 ? 'item' : 'items'} found
            </Text>
            <TouchableOpacity style={styles.sortBtn} onPress={toggleSort}>
              <ArrowUpDown size={14} color="#7C3AED" />
              <Text style={styles.sortBtnText}>{getSortLabel()}</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <FlatList
              data={Array(6).fill(null)}
              keyExtractor={(_, i) => String(i)}
              numColumns={2}
              contentContainerStyle={styles.gridContent}
              columnWrapperStyle={styles.gridRow}
              renderItem={() => <ProductSkeleton style={styles.gridSkeleton} />}
            />
          ) : products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No products found under this section.</Text>
            </View>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(p: Product) => p.id}
              numColumns={2}
              contentContainerStyle={styles.gridContent}
              columnWrapperStyle={styles.gridRow}
              renderItem={renderProductCard}
            />
          )}
        </View>
      </View>

      {/* Floating Cart FAB */}
      {itemCount > 0 && (
        <TouchableOpacity
          style={styles.cartFab}
          onPress={() => router.push('/(tabs)/cart')}
        >
          <ShoppingCart size={22} color="#fff" />
          <Text style={styles.cartFabText}>{itemCount} items • View Cart</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#fff',
  },
  backBtn: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerIconBtn: {
    padding: 4,
  },
  bodyRow: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 85,
    backgroundColor: '#F9FAFB',
    borderRightWidth: 1,
    borderRightColor: '#F3F4F6',
  },
  sidebarContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  sidebarItem: {
    width: 72,
    alignItems: 'center',
    marginBottom: 20,
  },
  sidebarIconWrapper: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sidebarIconWrapperActive: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  sidebarIcon: {
    width: '100%',
    height: '100%',
  },
  sidebarItemText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 14,
  },
  sidebarItemTextActive: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  toolbarTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  sortBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
  },
  gridContent: {
    padding: 8,
    paddingBottom: 100,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gridCardContainer: {
    width: '48%',
    marginBottom: 8,
  },
  gridSkeleton: {
    width: '48%',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  cartFab: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    zIndex: 100,
    backgroundColor: colors.primary,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  cartFabText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
})
