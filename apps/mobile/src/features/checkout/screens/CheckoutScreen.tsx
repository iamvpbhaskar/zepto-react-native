import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator
} from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import { useCartStore } from '../../cart/store/cart.store'
import { usePlaceOrder } from '../../../hooks/useOrders'
import { useWallet } from '../../../hooks/useWallet'
import { formatCurrency } from '@zepto/utils'
import { Button } from '../../../components/ui/Button'
import { colors, fontSize, spacing, radius, shadow } from '../../../theme'
import { MapPin, Wallet, Truck, CheckCircle } from 'lucide-react-native'
import type { Address } from '@zepto/types'

export default function CheckoutScreen() {
  const router = useRouter()
  const summary = useCartStore(s => s.summary)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'COD'>('WALLET')

  const addressesQuery = useQuery({
    queryKey: ['addresses'],
    queryFn: () => api.get('/addresses').then(r => r.data.data.addresses as Address[]),
  })

  React.useEffect(() => {
    const list = addressesQuery.data
    if (list && !selectedAddressId) {
      const defaultAddr = list.find(a => a.isDefault)
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id)
      } else if (list.length > 0) {
        setSelectedAddressId(list[0].id)
      }
    }
  }, [addressesQuery.data, selectedAddressId])

  const { data: walletData } = useWallet()
  const { mutate: placeOrder, isPending } = usePlaceOrder()

  const handlePlaceOrder = () => {
    if (!selectedAddressId) {
      Alert.alert('Select Address', 'Please select a delivery address')
      return
    }
    if (paymentMethod === 'WALLET' && walletData) {
      const walletBalance = Number(walletData.wallet.balance)
      const total = summary?.total ?? 0
      if (walletBalance < total) {
        Alert.alert(
          'Insufficient Balance',
          `Your wallet has ${formatCurrency(walletBalance)}. You need ${formatCurrency(total)}.`,
          [
            { text: 'Top Up Wallet', onPress: () => router.push('/(tabs)/wallet') },
            { text: 'Pay via COD', onPress: () => setPaymentMethod('COD') },
          ]
        )
        return
      }
    }

    placeOrder({
      addressId: selectedAddressId,
      paymentMethod,
    })
  }

  const addresses: Address[] = (addressesQuery.data as Address[]) ?? []

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Address Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>
          {addressesQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : addresses.length === 0 ? (
            <TouchableOpacity
              style={styles.addAddressBtn}
              onPress={() => router.push('/addresses/new')}
            >
              <Text style={styles.addAddressText}>+ Add Delivery Address</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.addressList}>
              {addresses.map(addr => (
                <TouchableOpacity
                  key={addr.id}
                  style={[styles.addressCard, selectedAddressId === addr.id && styles.addressCardSelected]}
                  onPress={() => setSelectedAddressId(addr.id)}
                >
                  <View style={styles.addressRadio}>
                    {selectedAddressId === addr.id && (
                      <View style={styles.addressRadioFill} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addressLabel}>{addr.label}</Text>
                    <Text style={styles.addressText}>{addr.line1}</Text>
                    {addr.line2 && <Text style={styles.addressText}>{addr.line2}</Text>}
                    <Text style={styles.addressText}>{addr.city}, {addr.state} - {addr.pincode}</Text>
                    {addr.landmark && <Text style={styles.addressLandmark}>Landmark: {addr.landmark}</Text>}
                  </View>
                  {addr.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Payment Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Wallet size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>
          <View style={styles.paymentList}>
            <TouchableOpacity
              style={[styles.paymentCard, paymentMethod === 'WALLET' && styles.paymentCardSelected]}
              onPress={() => setPaymentMethod('WALLET')}
            >
              <View style={styles.paymentRadio}>
                {paymentMethod === 'WALLET' && <View style={styles.paymentRadioFill} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentLabel}>Zepto Wallet</Text>
                {walletData && (
                  <Text style={styles.walletBalance}>
                    Balance: {formatCurrency(Number(walletData.wallet.balance))}
                  </Text>
                )}
              </View>
              <Wallet size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paymentCard, paymentMethod === 'COD' && styles.paymentCardSelected]}
              onPress={() => setPaymentMethod('COD')}
            >
              <View style={styles.paymentRadio}>
                {paymentMethod === 'COD' && <View style={styles.paymentRadioFill} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentLabel}>Cash on Delivery</Text>
                <Text style={styles.paymentSubLabel}>Pay when delivered</Text>
              </View>
              <Truck size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatCurrency(summary?.subtotal ?? 0)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              <Text style={[styles.summaryValue, summary?.isFreeDelivery && { color: colors.success }]}>
                {summary?.isFreeDelivery ? 'FREE' : formatCurrency(summary?.deliveryFee ?? 0)}
              </Text>
            </View>
            {summary && summary.discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={[styles.summaryValue, { color: colors.success }]}>
                  -{formatCurrency(summary.discount)}
                </Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(summary?.total ?? 0)}</Text>
            </View>
          </View>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Place Order CTA */}
      <View style={styles.bottomBar}>
        <Button
          title={isPending ? 'Placing Order...' : `Place Order • ${formatCurrency(summary?.total ?? 0)}`}
          onPress={handlePlaceOrder}
          loading={isPending}
          disabled={!selectedAddressId}
          size="lg"
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: spacing.base, gap: spacing.base, paddingBottom: 120 },
  section: { backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing.base, gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  addressList: { gap: 10 },
  addressCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: 12,
  },
  addressCardSelected: { borderColor: colors.primary, backgroundColor: '#f0fdf4' },
  addressRadio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  addressRadioFill: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  addressLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  addressText: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  addressLandmark: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  defaultBadge: {
    backgroundColor: '#dcfce7', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
  },
  defaultBadgeText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.primaryDark },
  addAddressBtn: {
    borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed',
    borderRadius: radius.md, padding: 16, alignItems: 'center',
  },
  addAddressText: { color: colors.primary, fontWeight: '600', fontSize: fontSize.sm },
  paymentList: { gap: 10 },
  paymentCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: 14,
  },
  paymentCardSelected: { borderColor: colors.primary, backgroundColor: '#f0fdf4' },
  paymentRadio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  paymentRadioFill: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  paymentLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  paymentSubLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  walletBalance: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '600', marginTop: 2 },
  summaryCard: { gap: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  summaryValue: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: fontSize.base, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', padding: spacing.base, paddingBottom: 34,
    borderTopWidth: 1, borderTopColor: colors.border, ...shadow.lg,
  },
})
