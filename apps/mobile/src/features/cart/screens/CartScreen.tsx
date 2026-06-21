import React, { useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, Modal, Dimensions
} from 'react-native'
import Animated, { ZoomIn } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, Redirect } from 'expo-router'
import { useAuthStore } from '../../auth/store/auth.store'
import { useCartStore } from '../store/cart.store'
import { useUpdateCartItem, useRemoveCartItem, useCart, useClearCart } from '../../../hooks/useCart'
import { api } from '../../../lib/api'
import { useQuery } from '@tanstack/react-query'
import { formatCurrency } from '@zepto/utils'
import { colors, fontSize, spacing, radius, shadow } from '../../../theme'
import { ShoppingCart, Plus, Minus, ArrowLeft, MapPin, X, ChevronDown, CheckCircle2, Receipt } from 'lucide-react-native'
import type { CartItem } from '@zepto/types'

const { height } = Dimensions.get('window')

export default function CartScreen() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { items, summary } = useCartStore()

  const mrpTotal = items.reduce((sum, item) => sum + Number(item.product.mrp) * item.quantity, 0)
  const priceTotal = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0)
  const totalMrpPayable = mrpTotal + (priceTotal >= 99 ? 0 : 30) + 10
  const { refetch } = useCart()
  const { mutate: updateQty } = useUpdateCartItem()
  const { mutate: removeItem } = useRemoveCartItem()
  const { mutate: clearCartApi } = useClearCart()

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => api.get('/addresses').then(r => r.data.data.addresses),
    enabled: !!user
  })
  
  const defaultAddress = addresses?.find((a: any) => a.isDefault) || addresses?.[0]

  const [showClearCart, setShowClearCart] = useState(false)
  const [showSlotModal, setShowSlotModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState('Next 15 mins')

  if (!user) {
    return <Redirect href="/login" />
  }

  const handleClearCart = () => {
    clearCartApi()
    setShowClearCart(false)
  }

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.product.images[0] ?? 'https://picsum.photos/100' }} style={styles.itemImage} resizeMode="contain" />
      <View style={styles.itemInfo}>
        <View style={styles.itemNameRow}>
          <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
          <TouchableOpacity onPress={() => removeItem(item.productId)}>
            <X size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <Text style={styles.itemPrice}>{formatCurrency(Number(item.product.price))} <Text style={styles.itemMrp}>{formatCurrency(Number(item.product.mrp))}</Text></Text>
        
        <View style={styles.itemBottomRow}>
          <TouchableOpacity style={styles.weightDropdown}>
            <Text style={styles.weightText}>{item.product.unit}</Text>
            <ChevronDown size={14} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.qtyControl}>
            <TouchableOpacity onPress={() => { if (item.quantity === 1) removeItem(item.productId); else updateQty({ productId: item.productId, quantity: item.quantity - 1 }) }} style={styles.qtyBtn}>
              <Minus size={14} color="#fff" />
            </TouchableOpacity>
            <Animated.Text key={item.quantity} entering={ZoomIn.duration(150)} style={styles.qtyText}>{item.quantity}</Animated.Text>
            <TouchableOpacity onPress={() => updateQty({ productId: item.productId, quantity: item.quantity + 1 })} style={styles.qtyBtn}>
              <Plus size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  )

  if (items.length === 0) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ArrowLeft color="#fff" size={24} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Cart (0)</Text>
        </View>
        <View style={styles.emptyContent}>
          <ShoppingCart size={64} color={colors.border} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(tabs)')}>
            <Text style={styles.browseBtnText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f6f8' }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ArrowLeft color="#fff" size={24} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Cart ({summary?.itemCount})</Text>
        </View>
        <TouchableOpacity style={styles.emptyCartBtn} onPress={() => setShowClearCart(true)}>
          <Text style={styles.emptyCartText}>Empty Cart</Text>
        </TouchableOpacity>
      </View>

      {/* Savings Strip */}
      {summary && summary.discount > 0 && (
        <View style={styles.savingsStrip}>
          <Text style={styles.savingsText}>₹{summary.discount} saved on this order</Text>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={i => i.productId}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <View style={styles.footer}>
            {/* Delivery Slot Block */}
            <View style={styles.deliveryBlock}>
              <View style={styles.deliveryInfo}>
                <Text style={styles.deliveryTitle}>Delivering to you in 15 mins!</Text>
                <Text style={styles.deliverySub}>Delivery time has slightly increase due to heavy rains.</Text>
              </View>
              <TouchableOpacity style={styles.changeSlotBtn} onPress={() => setShowSlotModal(true)}>
                <Text style={styles.changeSlotText}>Change Slot</Text>
              </TouchableOpacity>
            </View>

            {/* Delivery Instructions */}
            <Text style={styles.instructionTitle}>Delivery Instructions</Text>
            <View style={styles.instructionsContainer}>
              <View style={styles.instructionCard}>
                <CheckCircle2 size={16} color={colors.secondary} />
                <View>
                  <Text style={styles.instructionLabel}>Return the bag</Text>
                  <Text style={styles.instructionSub}>Help us reuse old bags.</Text>
                </View>
              </View>
              <View style={styles.instructionCard}>
                <CheckCircle2 size={16} color={colors.textMuted} />
                <View>
                  <Text style={styles.instructionLabel}>No Contact Delivery</Text>
                  <Text style={styles.instructionSub}>Leave at the door.</Text>
                </View>
              </View>
            </View>

            {/* Bill Details */}
            <View style={styles.billCard}>
              <View style={styles.billHeader}>
                <Receipt size={16} color={colors.textSecondary} />
                <Text style={styles.billCardTitle}>Bill Summary</Text>
              </View>

              {/* Item Total Row */}
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Item Total</Text>
                <Text style={styles.billValue}>
                  {mrpTotal > priceTotal && (
                    <Text style={styles.strikethrough}>₹{mrpTotal} </Text>
                  )}
                  <Text style={styles.billBoldVal}>₹{priceTotal}</Text>
                </Text>
              </View>

              {/* Delivery Fee Row Group */}
              <View style={styles.billRowGroup}>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Delivery Fee</Text>
                  <Text style={styles.billValue}>
                    {priceTotal >= 99 ? (
                      <>
                        <Text style={styles.strikethrough}>₹30</Text>
                        <Text style={styles.freeText}> FREE</Text>
                      </>
                    ) : (
                      <Text style={styles.billBoldVal}>₹30</Text>
                    )}
                  </Text>
                </View>
                {priceTotal < 99 && (
                  <Text style={styles.blueHelperText}>
                    Free above ₹99 (Unlock by adding ₹{(99 - priceTotal).toFixed(0)} more)
                  </Text>
                )}
              </View>

              {/* Handling Fee Row */}
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Handling Fee</Text>
                <Text style={styles.billValue}>
                  <Text style={styles.strikethrough}>₹10</Text>
                  <Text style={styles.freeText}> FREE</Text>
                </Text>
              </View>

              {/* Total Payable Row */}
              <View style={[styles.billRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>To Pay</Text>
                <Text style={styles.totalValue}>
                  {totalMrpPayable > (summary?.total ?? priceTotal) && (
                    <Text style={[styles.strikethrough, { fontSize: 13 }]}>₹{totalMrpPayable} </Text>
                  )}
                  <Text style={styles.totalBoldVal}>₹{summary?.total ?? (priceTotal + (priceTotal >= 99 ? 0 : 30))}</Text>
                </Text>
              </View>
            </View>

            <View style={{ height: 160 }} />
          </View>
        }
      />

      {/* Sticky Bottom Checkout */}
      <View style={styles.checkoutBar}>
        <View style={styles.addressRow}>
          <Text style={styles.addressLabel}>{defaultAddress?.type || 'HOME'}</Text>
          <Text style={styles.addressText} numberOfLines={1}>
            - {defaultAddress ? `${defaultAddress.line1}, ${defaultAddress.city}` : 'Select Delivery Address'}
          </Text>
          <TouchableOpacity style={styles.changeAddress} onPress={() => router.push('/addresses')}>
            <MapPin size={12} color={colors.primary} />
            <Text style={styles.changeAddressText}>CHANGE ADDRESS</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.payBtn} onPress={() => router.push('/checkout')}>
          <Text style={styles.payBtnText}>CONTINUE TO PAY ₹{summary?.total}</Text>
        </TouchableOpacity>
      </View>

      {/* Clear Cart Modal */}
      <Modal visible={showClearCart} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Are you sure of clearing your cart?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnOutline} onPress={() => setShowClearCart(false)}>
                <Text style={styles.modalBtnOutlineText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSolid} onPress={handleClearCart}>
                <Text style={styles.modalBtnSolidText}>Yes, Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Select Delivery Slot Modal */}
      <Modal visible={showSlotModal} transparent animationType="slide">
        <View style={styles.bottomSheetOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowSlotModal(false)} />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select Delivery Slot</Text>
              <TouchableOpacity onPress={() => setShowSlotModal(false)}><X size={24} color={colors.textSecondary} /></TouchableOpacity>
            </View>
            <Text style={styles.sheetDate}>Today 17 Jul (Sunday)</Text>
            
            <View style={styles.slotGrid}>
              {['Next 10 mins', 'Next 15 mins', 'Next 45 mins', '10 AM - 12 PM', '12 PM - 2 PM', '2 PM - 4 PM', '4 PM - 6 PM', '8 PM - 10 PM'].map((slot, i) => (
                <TouchableOpacity 
                  key={slot} 
                  style={[styles.slotBtn, selectedSlot === slot && styles.slotBtnActive, i === 0 && styles.slotBtnDisabled]}
                  onPress={() => i !== 0 && setSelectedSlot(slot)}
                  activeOpacity={i === 0 ? 1 : 0.7}
                >
                  <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextActive, i === 0 && styles.slotTextDisabled]}>{slot}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.secondary, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: fontSize.lg, fontWeight: '700' },
  emptyCartBtn: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.md },
  emptyCartText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  
  savingsStrip: { backgroundColor: '#dcfce7', paddingVertical: 8, alignItems: 'center' },
  savingsText: { color: '#166534', fontSize: 12, fontWeight: '700' },
  
  list: { backgroundColor: '#fff' },
  cartItem: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemImage: { width: 60, height: 60, marginRight: 16 },
  itemInfo: { flex: 1 },
  itemNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemName: { fontSize: 13, fontWeight: '600', color: colors.text, flex: 1, marginRight: 8 },
  itemPrice: { fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 4 },
  itemMrp: { fontSize: 11, color: colors.primary, textDecorationLine: 'line-through', fontWeight: '500' },
  itemBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  weightDropdown: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  weightText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.primary, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 4 },
  qtyBtn: { padding: 2 },
  qtyText: { color: '#fff', fontSize: 13, fontWeight: '700', minWidth: 16, textAlign: 'center' },
  
  footer: { backgroundColor: '#f5f6f8' },
  deliveryBlock: { backgroundColor: colors.secondary, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  deliveryInfo: { flex: 1, marginRight: 16 },
  deliveryTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  deliverySub: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  changeSlotBtn: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  changeSlotText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  
  instructionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, paddingHorizontal: 16, marginTop: 16, marginBottom: 8 },
  instructionsContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  instructionCard: { flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 8, flexDirection: 'row', gap: 8, ...shadow.sm, borderWidth: 1, borderColor: '#f1f5f9' },
  instructionLabel: { fontSize: 11, fontWeight: '700', color: colors.text, marginBottom: 2 },
  instructionSub: { fontSize: 10, color: colors.textMuted },
  
  billCard: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 8, gap: 12, ...shadow.sm },
  billHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
    marginBottom: 8,
  },
  billCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  billRowGroup: { gap: 2 },
  billLabel: { fontSize: 12, color: colors.textSecondary },
  billLabelSuccess: { fontSize: 12, color: '#16a34a', fontWeight: '600' },
  billValue: { fontSize: 12, fontWeight: '500', color: colors.text },
  billBoldVal: { fontWeight: '700', color: colors.text },
  freeText: { color: '#16a34a', fontWeight: '700' },
  blueHelperText: { fontSize: 11, color: '#2563eb', fontWeight: '600', marginTop: 2 },
  strikethrough: { textDecorationLine: 'line-through', color: colors.textMuted },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 14, fontWeight: '800', color: colors.text },
  totalValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  totalBoldVal: { fontWeight: '800', color: colors.text },
  
  checkoutBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#f1f5f9', padding: 12, paddingBottom: 30, borderTopWidth: 1, borderTopColor: colors.border },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  addressLabel: { fontSize: 11, fontWeight: '800', color: colors.text },
  addressText: { fontSize: 11, color: colors.textSecondary, flex: 1, marginHorizontal: 4 },
  changeAddress: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  changeAddressText: { fontSize: 10, fontWeight: '800', color: colors.primary },
  payBtn: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  payBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#fff', width: '85%', borderRadius: 16, padding: 24, alignItems: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 24 },
  modalActions: { flexDirection: 'row', gap: 16, width: '100%' },
  modalBtnOutline: { flex: 1, borderWidth: 1, borderColor: colors.primary, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  modalBtnOutlineText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  modalBtnSolid: { flex: 1, backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  modalBtnSolidText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  bottomSheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: colors.secondary },
  sheetDate: { fontSize: 13, color: colors.primary, fontWeight: '600', marginBottom: 20, textAlign: 'center' },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  slotBtn: { width: '48%', borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  slotBtnActive: { borderColor: colors.primary },
  slotBtnDisabled: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
  slotText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  slotTextActive: { color: colors.primary },
  slotTextDisabled: { color: '#cbd5e1' },

  emptyState: { flex: 1, backgroundColor: '#f5f6f8' },
  emptyContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 16, marginBottom: 8 },
  browseBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 16 },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
})
