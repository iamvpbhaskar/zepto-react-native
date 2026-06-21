import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  TouchableOpacity, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, Redirect } from 'expo-router'
import { useAuthStore } from '../../auth/store/auth.store'
import { useWallet, useWalletTransactions, useAddMoney } from '../../../hooks/useWallet'
import { formatCurrency, formatDate } from '@zepto/utils'
import { colors, fontSize, spacing, radius, shadow } from '../../../theme'
import { Wallet, ArrowDown, ArrowUp, RotateCcw, Plus } from 'lucide-react-native'

const TOP_UP_AMOUNTS = [100, 200, 500, 1000, 2000, 5000]

export default function WalletScreen() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { data: walletData, isLoading: walletLoading } = useWallet()
  const { data: txData, isLoading: txLoading } = useWalletTransactions()
  const { mutate: addMoney, isPending: adding } = useAddMoney()
  const [showTopUp, setShowTopUp] = useState(false)
  const [customAmount, setCustomAmount] = useState('')

  if (!user) {
    return <Redirect href="/login" />
  }

  const handleTopUp = (amount: number) => {
    Alert.alert(
      'Add Money',
      `Add ${formatCurrency(amount)} to your wallet?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            addMoney(amount, {
              onSuccess: () => {
                setShowTopUp(false)
                Alert.alert('Success', `${formatCurrency(amount)} added to wallet!`)
              },
            })
          },
        },
      ]
    )
  }

  const txTypeIcon: Record<string, any> = {
    CREDIT: { icon: ArrowDown, color: colors.success },
    DEBIT: { icon: ArrowUp, color: colors.danger },
    REFUND: { icon: RotateCcw, color: colors.info },
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.secondary }}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
        {/* Wallet Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View style={styles.walletIconBox}>
              <Wallet size={24} color="#fff" />
            </View>
            <Text style={styles.walletLabel}>Zepto Wallet</Text>
          </View>
          {walletLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.balance}>
                {formatCurrency(Number(walletData?.wallet.balance ?? 0))}
              </Text>
              <Text style={styles.balanceSub}>Available Balance</Text>
            </>
          )}
          <TouchableOpacity
            style={styles.addMoneyBtn}
            onPress={() => setShowTopUp(!showTopUp)}
          >
            <Plus size={18} color={colors.primary} />
            <Text style={styles.addMoneyText}>Add Money</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Top-Up */}
        {showTopUp && (
          <View style={styles.topUpCard}>
            <Text style={styles.topUpTitle}>Select Amount</Text>
            <View style={styles.amountsGrid}>
              {TOP_UP_AMOUNTS.map(amount => (
                <TouchableOpacity
                  key={amount}
                  style={styles.amountPill}
                  onPress={() => handleTopUp(amount)}
                  disabled={adding}
                >
                  <Text style={styles.amountPillText}>{formatCurrency(amount)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.customAmountContainer}>
              <Text style={styles.customAmountLabel}>Or enter custom amount</Text>
              <View style={styles.customAmountRow}>
                <View style={styles.customInputWrapper}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={styles.customInput}
                    placeholder="0"
                    keyboardType="number-pad"
                    value={customAmount}
                    onChangeText={setCustomAmount}
                    maxLength={6}
                  />
                </View>
                <TouchableOpacity 
                  style={[styles.customAddBtn, !customAmount && styles.customAddBtnDisabled]}
                  disabled={!customAmount || adding}
                  onPress={() => handleTopUp(Number(customAmount))}
                >
                  <Text style={styles.customAddBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
            {adding && <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />}
          </View>
        )}

        {/* Transactions */}
        <Text style={styles.txTitle}>Transaction History</Text>
        {txLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (txData as any)?.transactions.length === 0 ? (
          <View style={styles.emptyTx}>
            <Text style={styles.emptyTxText}>No transactions yet</Text>
          </View>
        ) : (
          <View style={styles.txList}>
            {((txData as any)?.transactions ?? []).map((tx: any) => {
              const { icon: TxIcon, color: txColor } = txTypeIcon[tx.type] ?? { icon: Wallet, color: colors.primary }
              return (
                <View key={tx.id} style={styles.txItem}>
                  <View style={[styles.txIconBox, { backgroundColor: `${txColor}20` }]}>
                    <TxIcon size={18} color={txColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txDescription} numberOfLines={1}>{tx.description}</Text>
                    <Text style={styles.txDate}>{formatDate(tx.createdAt)}</Text>
                    <View style={styles.txMeta}>
                      <Text style={[styles.txType, { color: txColor }]}>{tx.type}</Text>
                      <Text style={styles.txStatus}>{tx.status}</Text>
                    </View>
                  </View>
                  <Text style={[styles.txAmount, { color: tx.type === 'DEBIT' ? colors.danger : colors.success }]}>
                    {tx.type === 'DEBIT' ? '-' : '+'}{formatCurrency(Number(tx.amount))}
                  </Text>
                </View>
              )
            })}
          </View>
        )}
      </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { padding: spacing.base, gap: 16, paddingBottom: 40 },
  balanceCard: {
    borderRadius: radius.xl, padding: spacing.xl,
    backgroundColor: colors.secondary, gap: 8, ...shadow.lg,
  },
  balanceHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  walletIconBox: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  walletLabel: { color: 'rgba(255,255,255,0.85)', fontSize: fontSize.base, fontWeight: '600' },
  balance: { fontSize: fontSize['3xl'], fontWeight: '800', color: '#fff', marginTop: 4 },
  balanceSub: { color: 'rgba(255,255,255,0.7)', fontSize: fontSize.sm },
  addMoneyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', alignSelf: 'flex-start',
    borderRadius: radius.full, paddingHorizontal: 16, paddingVertical: 10, marginTop: 8,
  },
  addMoneyText: { color: colors.primary, fontWeight: '700', fontSize: fontSize.sm },
  topUpCard: {
    backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing.base,
    gap: 12, ...shadow.sm,
  },
  topUpTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  amountsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  amountPill: {
    borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.full,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  amountPillText: { color: colors.primary, fontWeight: '600', fontSize: fontSize.sm },
  
  customAmountContainer: { marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 },
  customAmountLabel: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: 8 },
  customAmountRow: { flexDirection: 'row', gap: 12 },
  customInputWrapper: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 12, backgroundColor: '#f8fafc'
  },
  currencySymbol: { fontSize: fontSize.lg, color: colors.textSecondary, marginRight: 4 },
  customInput: { flex: 1, fontSize: fontSize.lg, fontWeight: '700', color: colors.text, paddingVertical: 10 },
  customAddBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center' },
  customAddBtnDisabled: { backgroundColor: '#cbd5e1' },
  customAddBtnText: { color: '#fff', fontWeight: '700', fontSize: fontSize.md },
  
  txTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  txList: { gap: 10 },
  txItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: radius.lg, padding: 12, ...shadow.sm,
  },
  txIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txDescription: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  txDate: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  txMeta: { flexDirection: 'row', gap: 8, marginTop: 2 },
  txType: { fontSize: fontSize.xs, fontWeight: '700' },
  txStatus: { fontSize: fontSize.xs, color: colors.textMuted },
  txAmount: { fontSize: fontSize.base, fontWeight: '800' },
  emptyTx: { alignItems: 'center', paddingVertical: 40 },
  emptyTxText: { fontSize: fontSize.base, color: colors.textMuted },
})
