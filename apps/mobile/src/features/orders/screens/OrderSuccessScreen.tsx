import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useOrder } from '../../../hooks/useOrders'
import { formatCurrency } from '@zepto/utils'
import { Button } from '../../../components/ui/Button'
import { colors, fontSize, spacing, radius } from '../../../theme'
import { CheckCircle } from 'lucide-react-native'

export default function OrderSuccessScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data } = useOrder(id)
  const order = data?.order

  return (
    <View style={styles.container}>
      {/* Success Animation */}
      <View style={styles.iconWrapper}>
        <View style={styles.iconBg}>
          <CheckCircle size={64} color={colors.primary} />
        </View>
      </View>

      <Text style={styles.title}>Order Placed! 🎉</Text>
      <Text style={styles.subtitle}>Your groceries are on the way</Text>

      {order && (
        <View style={styles.orderCard}>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <View style={styles.orderMeta}>
            <Text style={styles.orderMetaLabel}>Items</Text>
            <Text style={styles.orderMetaValue}>{order.items?.length ?? 0}</Text>
          </View>
          <View style={styles.orderMeta}>
            <Text style={styles.orderMetaLabel}>Total Paid</Text>
            <Text style={styles.orderMetaValue}>{formatCurrency(Number(order.total))}</Text>
          </View>
          <View style={styles.orderMeta}>
            <Text style={styles.orderMetaLabel}>Payment</Text>
            <Text style={styles.orderMetaValue}>{order.paymentMethod}</Text>
          </View>
          <View style={styles.etaBanner}>
            <Text style={styles.etaText}>⏱  Arriving in approximately 10 minutes</Text>
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <Button
          title="Track Order"
          onPress={() => router.push(`/(tabs)/orders/${id}`)}
          size="lg"
        />
        <Button
          title="Continue Shopping"
          onPress={() => router.replace('/(tabs)')}
          variant="outline"
          size="lg"
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#fff', alignItems: 'center',
    justifyContent: 'center', padding: spacing.xl, gap: 16,
  },
  iconWrapper: { marginBottom: 8 },
  iconBg: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: fontSize['3xl'], fontWeight: '800', color: colors.text },
  subtitle: { fontSize: fontSize.base, color: colors.textSecondary },
  orderCard: {
    width: '100%', backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.xl, padding: spacing.lg, gap: 10, marginTop: 8,
  },
  orderNumber: {
    fontSize: fontSize.lg, fontWeight: '700', color: colors.primary,
    fontFamily: 'monospace', textAlign: 'center',
  },
  orderMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  orderMetaLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  orderMetaValue: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  etaBanner: {
    backgroundColor: '#fef3c7', borderRadius: radius.md,
    padding: 10, marginTop: 4,
  },
  etaText: { fontSize: fontSize.sm, fontWeight: '600', color: '#92400e', textAlign: 'center' },
  actions: { width: '100%', gap: 10, marginTop: 8 },
})
