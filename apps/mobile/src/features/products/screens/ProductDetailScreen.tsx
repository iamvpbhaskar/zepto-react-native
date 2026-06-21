import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, FlatList, Dimensions, SafeAreaView, StatusBar
} from 'react-native'
import Animated, { FadeIn, FadeOut, ZoomIn, LinearTransition } from 'react-native-reanimated'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useProduct, useProducts } from '../../../hooks/useProducts'
import { useAddToCart, useUpdateCartItem, useRemoveCartItem } from '../../../hooks/useCart'
import { useCartStore } from '../../cart/store/cart.store'
import { useWishlistStore } from '../../wishlist/store/wishlist.store'
import { formatCurrency, calcDiscountPercent } from '@zepto/utils'
import { Skeleton } from '../../../components/ui/Skeleton'
import { ProductCard } from '../components/ProductCard'
import { colors, fontSize, spacing, radius, shadow } from '../../../theme'
import { ChevronLeft, Search, Share, Star, Heart, ChevronRight, RotateCcw, Zap, ShoppingCart, Plus, Minus } from 'lucide-react-native'
import Toast from 'react-native-toast-message'

const { width } = Dimensions.get('window')

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()
  const { data, isLoading } = useProduct(slug)
  const { data: featuredData } = useProducts({ sort: 'popular', limit: 4 })
  const { mutate: updateQty } = useUpdateCartItem()
  const { mutate: addToCart } = useAddToCart()
  const { mutate: removeItem } = useRemoveCartItem()
  
  const getItemQuantity = useCartStore(s => s.getItemQuantity)
  const cartItemCount = useCartStore(s => s.itemCount)
  
  const { isLiked, toggleItem } = useWishlistStore()

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <Skeleton height={400} />
        <View style={{ padding: 16, gap: 12, marginTop: 20 }}>
          <Skeleton height={24} width="70%" />
          <Skeleton height={16} width="40%" />
          <Skeleton height={20} width="30%" />
        </View>
      </View>
    )
  }

  const product = data?.product
  if (!product) return null

  const qty = getItemQuantity(product.id)
  const discountAmount = Number(product.mrp) - Number(product.price)
  const liked = isLiked(product.id)

  const handleToggleWishlist = () => {
    toggleItem(product as any)
    if (!liked) {
      Toast.show({
        type: 'wishlistToast',
        text1: 'Item saved to wishlist',
        position: 'bottom',
        bottomOffset: 120, // offset above sticky footer
        onPress: () => router.push('/(tabs)/wishlist')
      })
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* Image Slider Area */}
        <View style={styles.imageSection}>
          {/* Blurred Background */}
          <Image 
            source={{ uri: product.images[0] ?? 'https://picsum.photos/400/400' }}
            style={StyleSheet.absoluteFill}
            blurRadius={20}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.1)' }]} />

          {/* Floating Header Actions */}
          <SafeAreaView>
            <View style={styles.header}>
              <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
                <ChevronLeft size={24} color="#000" />
              </TouchableOpacity>
              <View style={styles.headerRight}>
                <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/search')}>
                  <Search size={20} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerBtn}>
                  <Share size={20} color="#000" />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>

          {/* Main Image */}
          <View style={styles.mainImageContainer}>
            <Image
              source={{ uri: product.images[0] ?? 'https://picsum.photos/400/400' }}
              style={styles.mainImage}
              resizeMode="contain"
            />
          </View>

          {/* Dots Indicator Mock */}
          <View style={styles.dotsRow}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>

        {/* Content Area */}
        <View style={styles.contentSection}>
          
          {/* Rating */}
          <View style={styles.ratingRow}>
            <Star size={14} color="#16A34A" fill="#16A34A" />
            <Text style={styles.ratingText}> 4.2 (253)  |  22 mins</Text>
          </View>

          {/* Title */}
          <Text style={styles.productName}>{product.name}</Text>
          
          {/* Quantity & Wishlist */}
          <View style={styles.qtyWishlistRow}>
            <Text style={styles.productUnit}>Net quantity: {product.unit}</Text>
            <TouchableOpacity onPress={handleToggleWishlist} style={styles.wishlistBtn}>
              <Animated.View key={liked ? 'liked' : 'unliked'} entering={ZoomIn.duration(200)}>
                <Heart size={20} color={colors.primary} fill={liked ? colors.primary : 'transparent'} />
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Pricing */}
          <View style={styles.pricingSection}>
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>{formatCurrency(Number(product.price))}</Text>
            </View>
            <View style={styles.mrpRow}>
              <Text style={styles.mrpText}>MRP {formatCurrency(Number(product.mrp))} (incl. of all taxes)</Text>
              {discountAmount > 0 && (
                <Text style={styles.discountText}>  {formatCurrency(discountAmount)} OFF</Text>
              )}
            </View>
          </View>

          {/* Offers Mocks */}
          <TouchableOpacity style={styles.offerCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.offerTitle}>Get at <Text style={{fontWeight: '700'}}>₹{Math.floor(Number(product.price) * 0.9)}</Text> with coupon offers</Text>
              <Text style={styles.offerSub}>View all offers</Text>
            </View>
            <ChevronRight size={20} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.offerCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.offerTitle}>View all {product.category?.name ?? 'Brand'} products</Text>
            </View>
            <ChevronRight size={20} color={colors.border} />
          </TouchableOpacity>

          {/* Badges */}
          <View style={styles.badgesRow}>
            <View style={styles.badgeItem}>
              <RotateCcw size={28} color={colors.textSecondary} style={{ marginBottom: 8 }} />
              <Text style={styles.badgeText}>3 Days Exchange</Text>
            </View>
            <View style={styles.badgeItem}>
              <Zap size={28} color={colors.textSecondary} style={{ marginBottom: 8 }} />
              <Text style={styles.badgeText}>Fast Delivery</Text>
            </View>
          </View>

          {/* Accordions */}
          <View style={styles.accordionGroup}>
            <TouchableOpacity style={styles.accordionHeader}>
              <Text style={styles.accordionTitle}>Highlights</Text>
              <ChevronRight size={20} color={colors.text} style={{ transform: [{ rotate: '90deg' }] }} />
            </TouchableOpacity>
            <View style={styles.accordionBody}>
              <View style={styles.highlightRow}>
                <Text style={styles.highlightLabel}>Brand</Text>
                <Text style={styles.highlightValue}>Premium</Text>
              </View>
              <View style={styles.highlightRow}>
                <Text style={styles.highlightLabel}>Product Type</Text>
                <Text style={styles.highlightValue}>{product.category?.name ?? 'General'}</Text>
              </View>
              <TouchableOpacity style={{ alignSelf: 'center', marginTop: 12 }}>
                <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>View more ⌄</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.accordionGroup, { borderBottomWidth: 0 }]}>
            <TouchableOpacity style={styles.accordionHeader}>
              <Text style={styles.accordionTitle}>Information</Text>
              <ChevronRight size={20} color={colors.text} style={{ transform: [{ rotate: '90deg' }] }} />
            </TouchableOpacity>
          </View>

          {/* Similar Products */}
          <View style={styles.similarSection}>
            <Text style={styles.similarTitle}>You might also like</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={featuredData?.products ?? []}
              keyExtractor={(p) => p.id}
              contentContainerStyle={{ paddingHorizontal: spacing.lg }}
              renderItem={({ item }) => (
                <ProductCard product={item as any} style={{ width: 140, marginRight: 16 }} />
              )}
            />
          </View>

        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.stickyFooter}>
        <TouchableOpacity style={styles.footerCartBtn} onPress={() => router.push('/(tabs)/cart')}>
          <ShoppingCart size={24} color="#000" />
          {cartItemCount > 0 && (
            <Animated.View entering={ZoomIn} style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
            </Animated.View>
          )}
        </TouchableOpacity>

        <Animated.View layout={LinearTransition.springify().damping(15)} style={{ flex: 1 }}>
          {qty === 0 ? (
            <Animated.View entering={FadeIn} exiting={FadeOut}>
              <TouchableOpacity style={styles.footerAddBtn} onPress={() => addToCart({ productId: product.id, quantity: 1 })}>
                <Text style={styles.footerAddText}>Add to cart</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.footerQtyControl}>
              <TouchableOpacity onPress={() => { if (qty === 1) removeItem(product.id); else updateQty({ productId: product.id, quantity: qty - 1 }) }} style={styles.footerQtyBtn}>
                <Minus size={20} color="#fff" />
              </TouchableOpacity>
              <Animated.Text key={qty} entering={ZoomIn.duration(150)} style={styles.footerQtyText}>{qty}</Animated.Text>
              <TouchableOpacity onPress={() => updateQty({ productId: product.id, quantity: qty + 1 })} style={styles.footerQtyBtn}>
                <Plus size={20} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Light gray background behind cards
  },
  imageSection: {
    height: 420,
    width: '100%',
    position: 'relative',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: width,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  mainImageContainer: {
    width: 260,
    height: 260,
    marginTop: 40,
    backgroundColor: 'transparent',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    position: 'absolute',
    bottom: 30,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  dotActive: {
    backgroundColor: '#000',
  },
  contentSection: {
    marginTop: -16,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 20,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  productName: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: '#000',
    paddingHorizontal: spacing.lg,
    marginBottom: 8,
    lineHeight: 28,
  },
  qtyWishlistRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: 16,
  },
  productUnit: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  wishlistBtn: {
    backgroundColor: '#FCE7F3',
    padding: 8,
    borderRadius: 8,
  },
  pricingSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: 16,
  },
  priceBadge: {
    backgroundColor: '#16A34A',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  priceText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  mrpRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mrpText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  discountText: {
    fontSize: 14,
    color: '#16A34A',
    fontWeight: '700',
  },
  offerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: '#F3E8FF',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    marginBottom: 12,
  },
  offerTitle: {
    fontSize: 13,
    color: '#000',
    marginBottom: 4,
  },
  offerSub: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: spacing.lg,
    marginVertical: 20,
  },
  badgeItem: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F1F1F1',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 16,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  accordionGroup: {
    borderBottomWidth: 8,
    borderBottomColor: '#F3F4F6',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  accordionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: '#000',
  },
  accordionBody: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 20,
  },
  highlightRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  highlightLabel: {
    width: 120,
    fontSize: 14,
    color: colors.textSecondary,
  },
  highlightValue: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  similarSection: {
    paddingVertical: 24,
    backgroundColor: '#F3F4F6',
  },
  similarTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: '#000',
    paddingHorizontal: spacing.lg,
    marginBottom: 16,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 16,
    paddingBottom: 24, // safe area padding
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    ...shadow.md,
  },
  footerCartBtn: {
    width: 60,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  footerAddBtn: {
    flex: 1,
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerAddText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  footerQtyControl: {
    flex: 1,
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  footerQtyBtn: {
    padding: 8,
  },
  footerQtyText: {
    color: '#fff',
    fontSize: fontSize.lg,
    fontWeight: '800',
  },
})
