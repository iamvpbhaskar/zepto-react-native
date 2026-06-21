import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator, Clipboard
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useOrder, useCancelOrder, useReorder } from '../../../hooks/useOrders'
import { formatCurrency, formatDate } from '@zepto/utils'
import { ORDER_STATUS_LABELS } from '@zepto/config'
import { colors, fontSize, spacing, radius } from '../../../theme'
import { ChevronLeft, Star, Check, X, Zap, FileText, MessageSquare, Copy } from 'lucide-react-native'
import Toast from 'react-native-toast-message'

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data, isLoading } = useOrder(id)
  const { mutate: cancelOrder, isPending: cancelling } = useCancelOrder()
  const { mutate: reorder, isPending: reordering } = useReorder()

  const order = data?.order

  const [userRating, setUserRating] = useState<number>(5)

  const handleRate = (stars: number) => {
    setUserRating(stars)
    Toast.show({
      type: 'success',
      text1: `Thank you for rating ${stars} stars!`,
      position: 'bottom',
      bottomOffset: 80,
    })
  }

  const getOrderEffectiveStatus = (o: any) => {
    if (o.status === 'CANCELLED' || o.status === 'REFUNDED') {
      return o.status
    }
    const elapsedMs = Date.now() - new Date(o.createdAt).getTime()
    if (elapsedMs >= 5 * 60 * 1000) {
      return 'DELIVERED'
    }
    return o.status
  }

  const effectiveStatus = order ? getOrderEffectiveStatus(order) : 'PENDING'

  const getStatusDetails = () => {
    if (!order) return null
    const status = effectiveStatus
    const statusLabel = (ORDER_STATUS_LABELS as any)[status] || status

    if (status === 'CANCELLED' || status === 'REFUNDED') {
      return {
        label: statusLabel,
        icon: <X size={16} color="#EF4444" />,
        circleStyle: styles.statusIconCancelled,
        showPill: false,
        pillText: '',
      }
    }

    if (status === 'DELIVERED') {
      return {
        label: 'Delivered',
        icon: <Check size={16} color="#10B981" />,
        circleStyle: styles.statusIconDelivered,
        showPill: true,
        pillText: '10 MINS',
      }
    }

    // Active progress statuses (e.g. pending, confirmed, packed, out_for_delivery)
    return {
      label: statusLabel,
      icon: <Zap size={14} color="#7C3AED" fill="#7C3AED" />,
      circleStyle: styles.statusIconActive,
      showPill: true,
      pillText: '9 MINS ETA',
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  if (!order) return null

  const handleCancel = () => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: () => cancelOrder({ id: order.id, reason: 'Customer requested cancellation' }),
      },
    ])
  }

  const handleCopyOrderId = () => {
    Clipboard.setString(order.orderNumber)
    Toast.show({
      type: 'success',
      text1: 'Order ID copied to clipboard',
      position: 'bottom',
      bottomOffset: 80,
    })
  }

  const isCancelled = effectiveStatus === 'CANCELLED' || effectiveStatus === 'REFUNDED'
  const isCancellable = ['PENDING', 'CONFIRMED'].includes(effectiveStatus)
  
  // Calculate pricing summary details
  const subtotalNum = Number(order.subtotal)
  const discountNum = Number(order.discount)
  const totalNum = Number(order.total)
  const originalItemTotal = subtotalNum + discountNum

  return (
    <View style={styles.outerContainer}>
      {/* Custom Header to eliminate duplicate Stack header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>Order #{order.orderNumber}</Text>
          <Text style={styles.headerSubtitle}>
            {order.items?.length ?? 0} {order.items?.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
        <TouchableOpacity style={styles.getHelpBtn} onPress={() => {}}>
          <MessageSquare size={16} color="#E11D48" />
          <Text style={styles.getHelpText}>Get Help</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* Rated Banner (Delivered orders only) */}
        {effectiveStatus === 'DELIVERED' && (
          <View style={styles.ratedBanner}>
            <Text style={styles.ratedText}>
              {userRating > 0 ? "You rated: " : "Rate your delivery experience: "}
            </Text>
            <View style={styles.starsRow}>
              {Array(5).fill(0).map((_, i) => {
                const starVal = i + 1
                const isSelected = userRating > 0 ? starVal <= userRating : false
                return (
                  <TouchableOpacity key={i} onPress={() => handleRate(starVal)} activeOpacity={0.7}>
                    <Star 
                      size={14} 
                      color="#E11D48" 
                      fill={isSelected ? "#E11D48" : "transparent"} 
                      style={{ marginRight: 4 }} 
                    />
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        )}

        {/* Status Card Banner */}
        {(() => {
          const details = getStatusDetails()
          if (!details) return null
          return (
            <View style={styles.statusBannerCard}>
              <View style={styles.statusBannerLeft}>
                <View style={[styles.statusIconCircle, details.circleStyle]}>
                  {details.icon}
                </View>
                <Text style={styles.statusBannerTitle}>{details.label}</Text>
              </View>
              {details.showPill && (
                <View style={styles.arrivedPill}>
                  <Zap size={10} color="#7C3AED" fill="#7C3AED" />
                  <Text style={styles.arrivedText}>{details.pillText}</Text>
                </View>
              )}
            </View>
          )
        })()}

        {/* Order Items List */}
        {order.items && order.items.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>
              {order.items.length} {order.items.length === 1 ? 'item' : 'items'} in order
            </Text>
            <View style={styles.itemsList}>
              {order.items.map(item => (
                <View key={item.id} style={styles.orderItemRow}>
                  <View style={styles.itemImageWrapper}>
                    <Image 
                      source={{ uri: item.productImage || 'https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=200' }} 
                      style={styles.itemImage as any} 
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={2}>{item.productName}</Text>
                    <Text style={styles.itemUnit}>{item.unit} · {item.quantity} {item.quantity === 1 ? 'unit' : 'units'}</Text>
                  </View>
                  <Text style={styles.itemTotal}>{formatCurrency(Number(item.total))}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bill Summary */}
        <View style={styles.card}>
          <View style={styles.billHeaderRow}>
            <FileText size={18} color="#000" />
            <Text style={styles.billHeaderTitle}>Bill Summary</Text>
          </View>
          
          <View style={styles.billDetailRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <View style={styles.billValueRow}>
              {discountNum > 0 && (
                <Text style={styles.billOriginalStrikethrough}>{formatCurrency(originalItemTotal)}</Text>
              )}
              <Text style={styles.billFinalValue}>{formatCurrency(subtotalNum)}</Text>
            </View>
          </View>

          <View style={styles.billDetailRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <View style={styles.billValueRow}>
              <Text style={styles.billOriginalStrikethrough}>₹30</Text>
              <Text style={[styles.billFinalValue, styles.freeValue]}>FREE</Text>
            </View>
          </View>

          <View style={styles.billDetailRow}>
            <Text style={styles.billLabel}>Handling Fee</Text>
            <View style={styles.billValueRow}>
              <Text style={styles.billOriginalStrikethrough}>₹10</Text>
              <Text style={[styles.billFinalValue, styles.freeValue]}>FREE</Text>
            </View>
          </View>

          <View style={styles.billDivider} />

          <View style={styles.billTotalRow}>
            <Text style={styles.billTotalLabel}>Total Bill</Text>
            <View style={styles.billValueRow}>
              {discountNum > 0 && (
                <Text style={styles.billOriginalStrikethrough}>{formatCurrency(originalItemTotal + 40)}</Text>
              )}
              <Text style={styles.billTotalFinal}>{formatCurrency(totalNum)}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.invoiceBtn} onPress={() => {}}>
            <Text style={styles.invoiceBtnText}>Download Invoice / Credit Note</Text>
          </TouchableOpacity>
        </View>

        {/* Order Details (Meta Details) */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>Order Details</Text>
          <View style={styles.detailMetaRow}>
            <Text style={styles.metaLabel}>Order ID</Text>
            <TouchableOpacity style={styles.orderIdCopyRow} onPress={handleCopyOrderId}>
              <Text style={styles.metaValueText}>{order.orderNumber}</Text>
              <Copy size={14} color="#6B7280" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
          <View style={styles.detailMetaRow}>
            <Text style={styles.metaLabel}>Placed at</Text>
            <Text style={styles.metaValueText}>{formatDate(order.createdAt)}</Text>
          </View>
          {order.address && (
            <View style={styles.detailMetaRow}>
              <Text style={styles.metaLabel}>Deliver to</Text>
              <Text style={[styles.metaValueText, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                {order.address.label} - {order.address.line1}
              </Text>
            </View>
          )}
        </View>

        {/* Cancel Order Action if Pending */}
        {isCancellable && (
          <TouchableOpacity 
            style={styles.cancelBtn} 
            onPress={handleCancel}
            disabled={cancelling}
          >
            <Text style={styles.cancelBtnText}>{cancelling ? 'Cancelling...' : 'Cancel Order'}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Sticky Bottom Footer: Order Again */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.footerBtn} 
          onPress={() => reorder(order.id)}
          disabled={reordering}
        >
          <Text style={styles.footerBtnText}>
            {reordering ? 'Adding to Cart...' : 'Order Again'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  getHelpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFC0CB',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    gap: 4,
  },
  getHelpText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E11D48',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 100,
  },
  ratedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  ratedText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBannerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statusIconDelivered: {
    backgroundColor: '#D1FAE5',
  },
  statusIconCancelled: {
    backgroundColor: '#FEE2E2',
  },
  statusIconActive: {
    backgroundColor: '#F3E8FF',
  },
  statusBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
  arrivedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 3,
  },
  arrivedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C3AED',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  itemsList: {
    gap: 12,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImageWrapper: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    marginRight: 12,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemUnit: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  billHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  billHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  billDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  billValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  billOriginalStrikethrough: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginRight: 6,
  },
  billFinalValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  freeValue: {
    color: '#10B981',
    fontWeight: '700',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 10,
  },
  billTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  billTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
  },
  billTotalFinal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
  },
  invoiceBtn: {
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderRadius: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  invoiceBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
  },
  detailMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  metaLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  orderIdCopyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaValueText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  cancelBtn: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelBtnText: {
    color: '#E11D48',
    fontWeight: '700',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerBtn: {
    backgroundColor: '#E11D48',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
})
