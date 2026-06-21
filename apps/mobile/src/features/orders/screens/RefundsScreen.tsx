import React from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useOrders } from '../../../hooks/useOrders'
import { formatCurrency, formatDateShort } from '@zepto/utils'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@zepto/config'
import { colors, fontSize, spacing, radius, shadow } from '../../../theme'
import { ChevronLeft, RotateCcw } from 'lucide-react-native'
import type { Order } from '@zepto/types'

export default function RefundsScreen() {
  const router = useRouter()
  const { data, isLoading, refetch, isFetching } = useOrders()
  
  // Filter for CANCELLED or returned orders to represent refunds
  const refunds: Order[] = ((data as any)?.orders ?? []).filter((o: Order) => o.status === 'CANCELLED')

  const renderOrder = ({ item: order }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <Text style={styles.orderDate}>{formatDateShort(order.createdAt)}</Text>
        </View>
        <View style={styles.amountBadge}>
          <Text style={styles.amountText}>{formatCurrency(Number(order.total))}</Text>
        </View>
      </View>
      <View style={styles.orderBody}>
        <Text style={styles.statusText}>Refund Processed Successfully</Text>
        <Text style={styles.paymentMethod}>To {order.paymentMethod}</Text>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Refunds</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={refunds}
          keyExtractor={o => o.id}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isFetching}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <RotateCcw size={64} color={colors.border} />
              <Text style={styles.emptyTitle}>No Refunds Yet</Text>
              <Text style={styles.emptySubtitle}>You have no cancelled or refunded orders.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: '#000',
    marginLeft: 16,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.base, gap: 12, flexGrow: 1 },
  orderCard: {
    backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing.base,
    gap: 10, ...shadow.sm,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderNumber: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, fontFamily: 'monospace' },
  orderDate: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  amountBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.md },
  amountText: { color: '#16A34A', fontWeight: '700', fontSize: fontSize.sm },
  orderBody: { gap: 4, marginTop: 4 },
  statusText: { fontSize: fontSize.sm, color: colors.text, fontWeight: '500' },
  paymentMethod: { fontSize: fontSize.xs, color: colors.textMuted },
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 80,
  },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  emptySubtitle: { fontSize: fontSize.base, color: colors.textMuted },
})
