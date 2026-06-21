import React from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useWishlistStore } from '../store/wishlist.store'
import { colors, fontSize, spacing, radius } from '../../../theme'
import { Heart, Search, ShoppingCart, ChevronLeft } from 'lucide-react-native'
import { ProductCard } from '../../products/components/ProductCard'

export default function WishlistScreen() {
  const router = useRouter()
  const { items } = useWishlistStore()

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Heart size={64} color={colors.primary} fill={colors.primary} style={{ opacity: 0.8 }} />
      </View>
      <Text style={styles.emptyTitle}>Your Wishlist is empty</Text>
      <Text style={styles.emptySubtitle}>Start saving items you'd like to buy later, and they'll show up here</Text>
      <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/(tabs)/categories')}>
        <Text style={styles.exploreBtnText}>Explore Now</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Wishlist</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/search')}>
          <Search size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        {items.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={items}
            keyExtractor={item => item.id}
            numColumns={2}
            renderItem={({ item }) => (
              <View style={styles.cardContainer}>
                <ProductCard product={item} />
              </View>
            )}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: '#000',
  },
  iconBtn: {
    padding: spacing.xs,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    padding: spacing.base,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
  },
  cardContainer: {
    width: '48%',
    marginBottom: spacing.base,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fce7f3', // light pink background
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: '#000',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  exploreBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: radius.xl,
  },
  exploreBtnText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '700',
  },
})
