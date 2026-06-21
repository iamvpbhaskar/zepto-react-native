import React from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, ScrollView
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, Redirect } from 'expo-router'
import { useAuthStore } from '../../auth/store/auth.store'
import { useOrders, useReorder } from '../../../hooks/useOrders'
import { formatCurrency } from '@zepto/utils'
import { ORDER_STATUS_LABELS } from '@zepto/config'
import { colors, fontSize, spacing, radius, shadow } from '../../../theme'
import { Package, ChevronLeft, Star, Check, X, MoreVertical, Zap } from 'lucide-react-native'
import type { Order } from '@zepto/types'

function formatDateForOrdersList(dateString: string | Date) {
  const date = new Date(dateString)
  const day = date.getDate()
  let suffix = 'th'
  if (day === 1 || day === 21 || day === 31) suffix = 'st'
  else if (day === 2 || day === 22) suffix = 'nd'
  else if (day === 3 || day === 23) suffix = 'rd'
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  
  let hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'pm' : 'am'
  hours = hours % 12
  hours = hours ? hours : 12
  
  return `Placed at ${day}${suffix} ${month} ${year}, ${hours}:${minutes} ${ampm}`
}

function getOrderEffectiveStatus(order: Order) {
  if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
    return order.status
  }
  const elapsedMs = Date.now() - new Date(order.createdAt).getTime()
  if (elapsedMs >= 5 * 60 * 1000) {
    return 'DELIVERED'
  }
  return order.status
}

export default function OrdersScreen() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { data, isLoading, refetch, isFetching } = useOrders()
  const { mutate: reorder, isPending: reordering } = useReorder()
  const orders: Order[] = (data as any)?.orders ?? []

  if (!user) {
    return <Redirect href="/login" />
  }

  const renderOrder = ({ item: order }: { item: Order }) => {
    const effectiveStatus = getOrderEffectiveStatus(order)
    const isCancelled = effectiveStatus === 'CANCELLED' || effectiveStatus === 'REFUNDED'
    const isDelivered = effectiveStatus === 'DELIVERED'
    const isActive = !isCancelled && !isDelivered

    let statusIcon = <Check size={12} color="#10B981" />
    let statusIconStyle = styles.statusIconDelivered
    let statusTextStyle = styles.statusTextDelivered
    let statusText = 'Order delivered'

    if (isCancelled) {
      statusIcon = <X size={12} color="#6B7280" />
      statusIconStyle = styles.statusIconCancelled
      statusTextStyle = styles.statusTextCancelled
      statusText = effectiveStatus === 'CANCELLED' ? 'Order cancelled' : 'Order refunded'
    } else if (isActive) {
      statusIcon = <Zap size={10} color="#7C3AED" fill="#7C3AED" />
      statusIconStyle = styles.statusIconActive
      statusTextStyle = styles.statusTextActive
      statusText = ORDER_STATUS_LABELS[effectiveStatus] || effectiveStatus
    }
    
    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => router.push(`/(tabs)/orders/${order.id}`)}
        activeOpacity={0.9}
      >
        {/* Status and Price Header */}
        <View style={styles.cardHeader}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusIconCircle, statusIconStyle]}>
              {statusIcon}
            </View>
            <Text style={[styles.statusText, statusTextStyle]}>
              {statusText}
            </Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.cardPrice}>{formatCurrency(Number(order.total))}</Text>
            <TouchableOpacity style={styles.moreBtn} onPress={(e) => { e.stopPropagation(); }}>
              <MoreVertical size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Placed */}
        <Text style={styles.placedDate}>{formatDateForOrdersList(order.createdAt)}</Text>

        {/* Horizontal Row of Product Thumbnails */}
        {order.items && order.items.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.thumbsRow}
            contentContainerStyle={styles.thumbsContent}
          >
            {order.items.map((item: any) => (
              <View key={item.id} style={styles.thumbWrapper}>
                <Image 
                  source={{ uri: item.productImage || 'https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=200' }} 
                  style={styles.thumbImage} 
                  resizeMode="contain" 
                />
              </View>
            ))}
          </ScrollView>
        )}

        {/* Divider */}
        <View style={styles.cardDivider} />

        {/* Rating Experience (Only for delivered) */}
        {isDelivered && (
          <>
            <View style={styles.ratingRow}>
              <Text style={styles.ratingLabel}>Your delivery experience rating: </Text>
              <View style={styles.starsRow}>
                {Array(5).fill(0).map((_, i) => (
                  <Star key={i} size={14} color="#E11D48" fill="#E11D48" style={{ marginRight: 2 }} />
                ))}
              </View>
            </View>
            <View style={styles.cardDivider} />
          </>
        )}

        {/* Action Button: Order Again */}
        <TouchableOpacity 
          style={styles.orderAgainBtn} 
          onPress={(e) => { e.stopPropagation(); reorder(order.id); }}
        >
          <Text style={styles.orderAgainText}>Order Again</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F4F6' }} edges={['top']}>
      {/* Clean Custom Header to eliminate duplicates */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Orders</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={o => o.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isFetching}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Package size={64} color={colors.border} />
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySubtitle}>Your orders will appear here</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.shopBtn}>
              <Text style={styles.shopBtnText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  list: { padding: 12, paddingBottom: 40 },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginLeft: 12,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statusIconDelivered: {
    backgroundColor: '#D1FAE5',
  },
  statusIconCancelled: {
    backgroundColor: '#E5E7EB',
  },
  statusIconActive: {
    backgroundColor: '#F3E8FF',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusTextDelivered: {
    color: '#000',
  },
  statusTextCancelled: {
    color: '#000',
  },
  statusTextActive: {
    color: '#7C3AED',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000',
  },
  moreBtn: {
    marginLeft: 8,
    padding: 4,
  },
  placedDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 12,
  },
  thumbsRow: {
    marginBottom: 12,
  },
  thumbsContent: {
    gap: 8,
  },
  thumbWrapper: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    backgroundColor: '#FAF9FB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderAgainBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  orderAgainText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E11D48', // rose-600 pink reorder button text
  },
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 80,
  },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  emptySubtitle: { fontSize: fontSize.base, color: colors.textMuted },
  shopBtn: {
    marginTop: 8, backgroundColor: colors.primary, borderRadius: radius.full,
    paddingHorizontal: 28, paddingVertical: 12,
  },
  shopBtnText: { color: '#fff', fontWeight: '700', fontSize: fontSize.base },
})
