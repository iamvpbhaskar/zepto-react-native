import React from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, Redirect } from 'expo-router'
import { useAuthStore } from '../../auth/store/auth.store'
import { useWallet } from '../../../hooks/useWallet'
import { api } from '../../../lib/api'
import { formatCurrency } from '@zepto/utils'
import { colors, fontSize, spacing, radius } from '../../../theme'
import {
  ChevronLeft, ShoppingBag, MessageSquare, Heart, Wallet,
  RotateCcw, MapPin, User as UserIcon, ChevronRight, LogOut
} from 'lucide-react-native'

export default function ProfileScreen() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { data: walletData } = useWallet()

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post('/auth/logout')
          } catch {}
          await logout()
          router.replace('/login')
        }
      }
    ])
  }

  if (!user) {
    return <Redirect href="/login" />
  }

  const balance = walletData?.wallet?.balance ?? 0

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Sub Header */}
        <View style={styles.subHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.subHeaderTitle}>Profile</Text>
        </View>

        {/* User Info */}
        <View style={styles.userInfoSection}>
          <View style={styles.avatarCircle}>
            <UserIcon size={40} color="#fff" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user.name ?? 'Guest User'}</Text>
            <Text style={styles.userPhone}>{user.phone}</Text>
          </View>
        </View>

        {/* Action Cards Row */}
        <View style={styles.actionCardsRow}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/orders')}>
            <ShoppingBag size={24} color={colors.text} />
            <Text style={styles.actionCardText}>Your{'\n'}Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => {}}>
            <MessageSquare size={24} color={colors.text} />
            <Text style={styles.actionCardText}>Help &{'\n'}Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/wishlist')}>
            <Heart size={24} color={colors.text} />
            <Text style={styles.actionCardText}>Your{'\n'}Wishlist</Text>
          </TouchableOpacity>
        </View>

        {/* Zepto Cash Banner */}
        <View style={styles.walletBanner}>
          <View style={styles.walletHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Wallet size={20} color={colors.secondary} />
              <Text style={styles.walletTitle}>Zepto Cash & Gift Card</Text>
            </View>
            <ChevronRight size={20} color={colors.textMuted} />
          </View>
          <View style={styles.walletDivider} />
          <View style={styles.walletBody}>
            <Text style={styles.walletBalanceLabel}>
              Available Balance <Text style={styles.walletBalanceAmount}>{formatCurrency(Number(balance))}</Text>
            </Text>
            <TouchableOpacity style={styles.addBalanceBtn} onPress={() => router.push('/(tabs)/wallet')}>
              <Text style={styles.addBalanceText}>Add Balance</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Information List */}
        <View style={styles.infoSection}>
          <Text style={styles.infoSectionTitle}>Your Information</Text>
          
          <View style={styles.listContainer}>
            <TouchableOpacity style={styles.listItem} onPress={() => router.push('/refunds')}>
              <RotateCcw size={24} color={colors.text} />
              <Text style={styles.listItemText}>Your Refunds</Text>
              <ChevronRight size={20} color={colors.border} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.listItem} onPress={() => router.push('/(tabs)/wishlist')}>
              <Heart size={24} color={colors.text} />
              <Text style={styles.listItemText}>Your Wishlist</Text>
              <ChevronRight size={20} color={colors.border} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.listItem} onPress={() => {}}>
              <MessageSquare size={24} color={colors.text} />
              <Text style={styles.listItemText}>Help & Support</Text>
              <ChevronRight size={20} color={colors.border} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.listItem} onPress={() => router.push('/addresses')}>
              <MapPin size={24} color={colors.text} />
              <View style={{ flex: 1 }}>
                <Text style={styles.listItemText}>Saved Addresses</Text>
                <Text style={styles.listItemSubtext}>Manage locations</Text>
              </View>
              <ChevronRight size={20} color={colors.border} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  subHeaderTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: '#000',
  },
  userInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#7C3AED', // Purple avatar bg
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userDetails: {
    justifyContent: 'center',
  },
  userName: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: '#000',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  actionCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionCardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginTop: 8,
  },
  walletBanner: {
    marginHorizontal: spacing.lg,
    marginTop: 24,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F3E8FF', // Light purple border
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FDFBFF',
  },
  walletTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: '#000',
  },
  walletDivider: {
    height: 1,
    backgroundColor: '#F3E8FF',
  },
  walletBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  walletBalanceLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  walletBalanceAmount: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: '#000',
  },
  addBalanceBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: '#fff',
  },
  addBalanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  infoSection: {
    marginTop: 32,
  },
  infoSectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: '#000',
    paddingHorizontal: spacing.xl,
    marginBottom: 16,
  },
  listContainer: {
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F1F1',
    paddingVertical: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: spacing.xl,
  },
  listItemText: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: '600',
    color: '#000',
    marginLeft: 16,
  },
  listItemSubtext: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 16,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    paddingVertical: 16,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.danger,
  },
})
