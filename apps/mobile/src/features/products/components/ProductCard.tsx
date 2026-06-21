import React from 'react'
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native'
import Animated, { FadeIn, FadeOut, ZoomIn, LinearTransition } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { useUpdateCartItem, useAddToCart, useRemoveCartItem } from '../../../hooks/useCart'
import { useCartStore } from '../../cart/store/cart.store'
import { useWishlistStore } from '../../wishlist/store/wishlist.store'
import { formatCurrency, calcDiscountPercent } from '@zepto/utils'
import { colors, fontSize, radius, spacing } from '../../../theme'
import { Plus, Minus, Heart, Star } from 'lucide-react-native'
import Toast from 'react-native-toast-message'
import type { Product } from '@zepto/types'

interface ProductCardProps {
  product: Product
  style?: any
}

export function ProductCard({ product, style }: ProductCardProps) {
  const router = useRouter()
  const { getItemQuantity } = useCartStore()
  const { mutate: updateQty } = useUpdateCartItem()
  const { mutate: addToCart } = useAddToCart()
  const { mutate: removeItem } = useRemoveCartItem()
  
  const { isLiked, toggleItem } = useWishlistStore()
  const liked = isLiked(product.id)

  const qty = getItemQuantity(product.id)
  const discountAmount = Number(product.mrp) - Number(product.price)

  const handleToggleWishlist = () => {
    toggleItem(product)
    if (!liked) {
      Toast.show({
        type: 'wishlistToast', // Will define this custom toast type next
        text1: 'Item saved to wishlist',
        position: 'bottom',
        bottomOffset: 80,
        onPress: () => router.push('/(tabs)/wishlist')
      })
    }
  }

  // Stable, deterministic ratings and review counts so they don't fluctuate on every state change/re-render
  const { rating, reviews } = React.useMemo(() => {
    let hash = 0
    const idStr = String(product.id || product.slug || '')
    for (let i = 0; i < idStr.length; i++) {
      hash = idStr.charCodeAt(i) + ((hash << 5) - hash)
    }
    const ratingSeed = Math.abs(hash % 9)
    const ratingVal = 4.1 + ratingSeed * 0.1
    const reviewsSeed = Math.abs((hash >> 2) % 950)
    const reviewsVal = 50 + reviewsSeed
    return { rating: ratingVal, reviews: reviewsVal }
  }, [product.id, product.slug])

  return (
    <View style={[styles.productCard, style]}>
      {/* Image Area */}
      <View style={styles.imageContainer}>
        <TouchableOpacity
          style={styles.productImageWrapper}
          onPress={() => router.push(`/product/${product.slug}`)}
          activeOpacity={0.8}
        >
          <Image source={{ uri: product.images[0] }} style={styles.productImage} resizeMode="contain" />
        </TouchableOpacity>

        {/* Wishlist Button: positioned absolutely relative to imageContainer */}
        <TouchableOpacity 
          style={styles.wishlistBtn} 
          onPress={handleToggleWishlist}
          activeOpacity={0.7}
          hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
        >
          <Animated.View key={liked ? 'liked' : 'unliked'} entering={ZoomIn.duration(200)}>
            <Heart size={16} color={colors.primary} fill={liked ? colors.primary : '#fff'} />
          </Animated.View>
        </TouchableOpacity>

        {/* Add to Cart / Qty Control: positioned absolutely relative to imageContainer */}
        <Animated.View layout={LinearTransition.springify().damping(15)} style={styles.actionContainer}>
          {qty === 0 ? (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => addToCart({ productId: product.id, quantity: 1, product })}
              activeOpacity={0.8}
            >
              <Text style={styles.addBtnText}>ADD</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.qtyControl}>
              <TouchableOpacity
                onPress={() => { if (qty === 1) removeItem(product.id); else updateQty({ productId: product.id, quantity: qty - 1 }); }}
                style={styles.qtyBtn}
                activeOpacity={0.8}
              >
                <Minus size={14} color="#fff" />
              </TouchableOpacity>
              <Animated.Text key={qty} entering={ZoomIn.duration(150)} style={styles.qtyText}>{qty}</Animated.Text>
              <TouchableOpacity
                onPress={() => updateQty({ productId: product.id, quantity: qty + 1 })}
                style={styles.qtyBtn}
                activeOpacity={0.8}
              >
                <Plus size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>

      {/* Details Area: separate touchable sibling to resolve touch nesting latency */}
      <TouchableOpacity
        style={styles.detailsContainer}
        onPress={() => router.push(`/product/${product.slug}`)}
        activeOpacity={0.7}
      >
        {/* Product Name */}
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        
        {/* Product Unit / Weight */}
        <Text style={styles.productUnit}>{product.unit}</Text>

        {/* Ratings & Tags in a Clean Row */}
        <View style={styles.ratingAndTagRow}>
          <View style={styles.ratingBadge}>
            <Star size={10} color="#16A34A" fill="#16A34A" />
            <Text style={styles.ratingText}> {rating.toFixed(1)}</Text>
          </View>
          <Text style={styles.reviewsText}>({reviews > 1000 ? (reviews / 1000).toFixed(1) + 'k' : reviews})</Text>
          {product.category?.name && (
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>{product.category.name}</Text>
            </View>
          )}
        </View>

        {/* Pricing Row */}
        <View style={styles.priceContainer}>
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>{formatCurrency(Number(product.price))}</Text>
            {discountAmount > 0 && (
              <Text style={styles.mrpText}>{formatCurrency(Number(product.mrp))}</Text>
            )}
          </View>
          {discountAmount > 0 && (
            <Text style={styles.discountText}>{formatCurrency(discountAmount)} OFF</Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    position: 'relative',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  productImageWrapper: {
    aspectRatio: 1,
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    overflow: 'hidden',
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '90%',
    height: '90%',
  },
  wishlistBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 15,
  },
  actionContainer: {
    position: 'absolute',
    bottom: -8,
    right: 6,
    zIndex: 20,
  },
  addBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 12,
    minWidth: 64,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addBtnText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 12,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 6,
    height: 28,
    minWidth: 70,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  qtyBtn: {
    paddingHorizontal: 6,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },
  detailsContainer: {
    paddingTop: 8,
    paddingHorizontal: 2,
  },
  productName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 16,
    marginBottom: 2,
    height: 32,
  },
  productUnit: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  ratingAndTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 10,
    color: '#374151',
    fontWeight: '700',
  },
  reviewsText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginRight: 6,
  },
  tagBadge: {
    backgroundColor: '#EEF2F6',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tagText: {
    color: '#4B5563',
    fontSize: 9,
    fontWeight: '600',
  },
  priceContainer: {
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginRight: 4,
  },
  mrpText: {
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  discountText: {
    color: '#16A34A',
    fontWeight: '700',
    fontSize: 10,
    marginTop: 1,
  },
})
