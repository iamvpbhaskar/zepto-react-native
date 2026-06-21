import React, { useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  Image, TouchableOpacity, RefreshControl, Dimensions, StatusBar
} from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import { useFeaturedProducts } from '../../../hooks/useProducts'
import { useAddToCart } from '../../../hooks/useCart'
import { useCartStore } from '../../cart/store/cart.store'
import { formatCurrency, calcDiscountPercent } from '@zepto/utils'
import { FREE_DELIVERY_THRESHOLD } from '@zepto/config'
import { Skeleton, ProductSkeleton } from '../../../components/ui/Skeleton'
import { ProductCard } from '../../products/components/ProductCard'
import { colors, fontSize, spacing, radius, shadow } from '../../../theme'
import { ShoppingCart, Plus, Minus, MapPin, ChevronDown, User, Search, Bike } from 'lucide-react-native'

const { width } = Dimensions.get('window')
const BANNER_WIDTH = width - spacing.lg * 2
const CATEGORY_WIDTH = (width - spacing.lg * 2 - spacing.md * 3) / 4

export default function HomeScreen() {
  const router = useRouter()
  const { mutate: addToCart } = useAddToCart()
  const items = useCartStore(s => s.items)
  const itemCount = useCartStore(s => s.itemCount)
  const getItemQuantity = useCartStore(s => s.getItemQuantity)

  // Calculate dynamic subtotal in real-time
  const cartSubtotal = React.useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0)
  }, [items])

  const bannersQuery = useQuery({
    queryKey: ['banners'],
    queryFn: () => api.get('/banners').then(r => r.data.data.banners),
    staleTime: 1000 * 60 * 5,
  })

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data.data.categories),
    staleTime: 1000 * 60 * 10,
  })

  const featuredQuery = useFeaturedProducts()

  // Dynamic promo banner rotation
  const [promoIndex, setPromoIndex] = React.useState(0)
  const promos = [
    '% Get 10% Off on adding items worth ₹999 to cart!',
    '🛵 Free Delivery on orders above ₹199!',
    "🌟 Check out our Father's Day Specials!"
  ]
  React.useEffect(() => {
    const interval = setInterval(() => {
      setPromoIndex(prev => (prev + 1) % promos.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const isRefreshing = false
  const onRefresh = useCallback(() => {
    bannersQuery.refetch()
    categoriesQuery.refetch()
    featuredQuery.refetch()
  }, [])

  const renderProductCard = ({ item: product }: { item: any }) => (
    <ProductCard product={product} style={{ width: 140, marginRight: 16 }} />
  )

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#8DE2E7" />
      
      {/* Custom Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.etaText}>⚡ 9 minutes</Text>
            <TouchableOpacity style={styles.locationContainer} onPress={() => router.push('/addresses')}>
              <Text style={styles.locationText} numberOfLines={1}>Work - 153, B5, VJF9+6CM, DLF Newt...</Text>
              <ChevronDown size={14} color="#000" />
            </TouchableOpacity>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.walletPill} onPress={() => router.push('/(tabs)/wallet')}>
              <View style={styles.walletIcon} />
              <Text style={styles.walletPillText}>₹0</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.profileBtn}>
              <User size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Search Bar overlapping */}
        <TouchableOpacity style={styles.searchContainer} onPress={() => router.push('/search')} activeOpacity={0.9}>
          <Search size={20} color={colors.textMuted} />
          <Text style={styles.searchPlaceholder}>Search for anything...</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Banners Carousel */}
        {bannersQuery.isLoading ? (
          <Skeleton width={BANNER_WIDTH} height={160} borderRadius={16} style={styles.bannerSkeleton} />
        ) : (
          <FlatList
            data={bannersQuery.data}
            keyExtractor={b => b.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.bannerList}
            contentContainerStyle={{ paddingHorizontal: spacing.lg }}
            renderItem={({ item: banner }) => (
              <TouchableOpacity style={[styles.bannerItem, { width: BANNER_WIDTH }]}>
                <Image source={{ uri: banner.imageUrl }} style={styles.bannerImage} resizeMode="cover" />
              </TouchableOpacity>
            )}
          />
        )}

        {/* Your Go-to Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Go-to Items</Text>
            <TouchableOpacity onPress={() => router.push('/products')}>
              <Text style={styles.seeAll}>See All &gt;</Text>
            </TouchableOpacity>
          </View>
          {featuredQuery.isLoading ? (
            <FlatList
              data={Array(4).fill(null)}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={() => <ProductSkeleton />}
              contentContainerStyle={{ paddingHorizontal: spacing.lg }}
            />
          ) : (
            <FlatList
              data={featuredQuery.data?.products}
              keyExtractor={p => p.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.lg }}
              renderItem={renderProductCard}
            />
          )}
        </View>

        {/* Explore By Categories */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { paddingHorizontal: spacing.lg }]}>
            <Text style={styles.sectionTitle}>Explore By Categories</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/categories')}>
              <Text style={styles.seeAll}>See All &gt;</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.promoBanner}>
            <Text style={styles.promoBannerText}>{promos[promoIndex]}</Text>
          </View>

          <View style={styles.categoryGrid}>
            {categoriesQuery.isLoading ? null : categoriesQuery.data?.map((cat: any) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryCard, { width: CATEGORY_WIDTH }]}
                onPress={() => router.push(`/category/${cat.slug}`)}
              >
                <View style={styles.categoryImageBg}>
                  <Image source={{ uri: cat.imageUrl }} style={styles.categoryImage} resizeMode="contain" />
                </View>
                <Text style={styles.categoryName} numberOfLines={2}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Floating Cart Island */}
      <View style={styles.floatingCartContainer}>
        {/* Delivery Progress Pill */}
        <View style={styles.floatingCartLeft}>
          <View style={styles.floatingCartIconBox}>
            <Bike size={18} color="#fff" />
          </View>
          <View style={styles.floatingTextContainer}>
            <Text style={styles.floatingCartTitle}>
              {cartSubtotal >= FREE_DELIVERY_THRESHOLD ? "Free delivery unlocked! 🥳" : "Unlock free delivery"}
            </Text>
            <Text style={styles.floatingCartSub}>
              {cartSubtotal >= FREE_DELIVERY_THRESHOLD 
                ? "No delivery charges on this order" 
                : cartSubtotal === 0 
                  ? `Shop for ₹${FREE_DELIVERY_THRESHOLD}` 
                  : `Shop for ₹${(FREE_DELIVERY_THRESHOLD - cartSubtotal).toFixed(0)} more`}
            </Text>
          </View>
        </View>

        {/* Dynamic Cart Pill */}
        {itemCount > 0 && (
          <TouchableOpacity style={styles.floatingCartBtn} onPress={() => router.push('/(tabs)/cart')} activeOpacity={0.9}>
            <View style={styles.cartPreviewBox}>
              {items[0]?.product?.images[0] ? (
                <Image source={{ uri: items[0].product.images[0] }} style={styles.cartPreviewImage} />
              ) : (
                <ShoppingCart size={16} color={colors.primary} />
              )}
            </View>
            <View style={styles.cartBtnTextContainer}>
              <Text style={styles.floatingCartText}>Cart</Text>
              <Text style={styles.floatingCartItemCount}>{itemCount} item{itemCount > 1 ? 's' : ''}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: '#8DE2E7', // Light blue zepto color
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: { flex: 1 },
  etaText: { fontSize: 24, fontWeight: '900', color: '#1C1C1C', marginBottom: 2, letterSpacing: -0.5 },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 16,
  },
  locationText: {
    color: '#1C1C1C',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  walletPill: {
    backgroundColor: '#fff', borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 6,
    flexDirection: 'row', alignItems: 'center', gap: 6, ...shadow.sm
  },
  walletIcon: { width: 14, height: 14, backgroundColor: colors.secondary, borderRadius: 4 },
  walletPillText: { color: colors.secondary, fontWeight: '800', fontSize: 12 },
  profileBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  
  searchContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
    gap: 10,
  },
  searchPlaceholder: { color: colors.textMuted, fontSize: fontSize.md },
  
  content: { paddingBottom: 180 },
  pinkBanner: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    alignItems: 'center',
  },
  pinkBannerText: { color: '#fff', fontSize: fontSize.sm, fontWeight: '700', fontStyle: 'italic' },
  
  bannerSkeleton: { marginHorizontal: spacing.lg, marginTop: spacing.md },
  bannerList: { marginTop: spacing.md },
  bannerItem: {
    marginRight: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
    height: 160,
  },
  bannerImage: { width: '100%', height: '100%' },
  
  section: { marginTop: spacing.xl },
  sectionHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, marginBottom: 12,
  },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  seeAll: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '700' },
  
  productCard: {
    width: 140,
    marginRight: spacing.md,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 10,
    ...shadow.sm,
  },
  productImageWrapper: { position: 'relative', alignItems: 'center', marginBottom: 8 },
  productImage: { width: 100, height: 100 },
  discountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    width: 32, height: 32,
    borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    transform: [{ rotate: '-10deg' }]
  },
  discountText: { color: '#fff', fontSize: 10, fontWeight: '800', lineHeight: 10, marginTop: 4 },
  discountTextOff: { color: '#fff', fontSize: 8, fontWeight: '800', lineHeight: 8 },
  
  productName: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, marginBottom: 4 },
  productUnit: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: 8 },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { fontSize: fontSize.sm, fontWeight: '800', color: colors.secondary },
  productMrp: { fontSize: 10, color: colors.textMuted, textDecorationLine: 'line-through' },
  
  addBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f1f1',
    alignItems: 'center', justifyContent: 'center',
    ...shadow.sm,
  },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary, borderRadius: radius.md, padding: 4,
  },
  qtyBtn: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: fontSize.sm, fontWeight: '700', color: '#fff', minWidth: 16, textAlign: 'center' },
  
  promoBanner: {
    marginHorizontal: spacing.lg,
    backgroundColor: '#A422D1', // Purple/Pink accent
    padding: 10,
    borderRadius: radius.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  promoBannerText: { color: '#fff', fontWeight: '700', fontSize: fontSize.sm },
  
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  categoryCard: { alignItems: 'center', gap: 8, marginBottom: 8 },
  categoryImageBg: {
    backgroundColor: '#F8EAF2',
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.xl,
    alignItems: 'center', justifyContent: 'center',
    padding: 8,
  },
  categoryImage: { width: '80%', height: '80%' },
  categoryName: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },

  floatingCartContainer: {
    position: 'absolute',
    bottom: 88, // Hover above floating bottom tab bar
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  floatingCartLeft: {
    flex: 1,
    backgroundColor: '#2C353E',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  floatingCartIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingTextContainer: {
    flex: 1,
  },
  floatingCartTitle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  floatingCartSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  floatingCartBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  cartPreviewBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cartPreviewImage: {
    width: '100%',
    height: '100%',
  },
  cartBtnTextContainer: {
    justifyContent: 'center',
  },
  floatingCartText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  floatingCartItemCount: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    fontWeight: '700',
  },
})
