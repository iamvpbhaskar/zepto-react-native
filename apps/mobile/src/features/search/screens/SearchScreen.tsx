import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TextInput, FlatList,
  TouchableOpacity, Image, ActivityIndicator
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSearchProducts } from '../../../hooks/useProducts'
import { useAddToCart } from '../../../hooks/useCart'
import { formatCurrency } from '@zepto/utils'
import { colors, fontSize, spacing, radius } from '../../../theme'
import { SEARCH_DEBOUNCE_MS } from '@zepto/config'
import { ArrowLeft, Search, X } from 'lucide-react-native'
import type { Product } from '@zepto/types'

export default function SearchScreen() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const inputRef = useRef<TextInput>(null)
  const { mutate: addToCart } = useAddToCart()

  // Focus input on mount
  useEffect(() => { inputRef.current?.focus() }, [])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  const { data, isLoading, isFetching } = useSearchProducts(debouncedQuery)

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => router.push(`/product/${item.slug}`)}
    >
      <Image source={{ uri: item.images[0] }} style={styles.resultImage} />
      <View style={styles.resultInfo}>
        <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.resultUnit}>{item.unit}</Text>
        <Text style={styles.resultPrice}>{formatCurrency(Number(item.price))}</Text>
      </View>
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => addToCart({ productId: item.id, quantity: 1 })}
      >
        <Text style={styles.addBtnText}>ADD</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Search groceries, snacks..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setDebouncedQuery('') }}>
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {debouncedQuery.length < 2 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>Search for groceries</Text>
          <Text style={styles.emptySubtitle}>Try "milk", "fruits", "snacks"</Text>
        </View>
      ) : isFetching ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : data?.products.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>😕</Text>
          <Text style={styles.emptyTitle}>No results for "{debouncedQuery}"</Text>
          <Text style={styles.emptySubtitle}>Try a different search term</Text>
        </View>
      ) : (
        <FlatList
          data={data?.products}
          keyExtractor={(p: Product) => p.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    backgroundColor: '#fff',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: 4 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.full,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  input: { flex: 1, fontSize: fontSize.base, color: colors.text },
  list: { padding: spacing.base, gap: 12 },
  resultItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: radius.lg, padding: 12,
  },
  resultImage: { width: 60, height: 60, borderRadius: 10 },
  resultInfo: { flex: 1 },
  resultName: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  resultUnit: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  resultPrice: { fontSize: fontSize.base, fontWeight: '700', color: colors.text, marginTop: 4 },
  addBtn: {
    backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: radius.md,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: fontSize.sm },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: spacing.xl },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  emptySubtitle: { fontSize: fontSize.sm, color: colors.textMuted },
})
