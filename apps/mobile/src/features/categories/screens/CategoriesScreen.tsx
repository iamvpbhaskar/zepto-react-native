import React from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Dimensions, ActivityIndicator
} from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import { Search, Heart } from 'lucide-react-native'
import { colors, spacing, radius, fontSize } from '../../../theme'

const { width } = Dimensions.get('window')
const COLUMN_COUNT = 3
const PADDING = spacing.lg * 2
const GAP = spacing.base
const ITEM_WIDTH = (width - PADDING - (GAP * (COLUMN_COUNT - 1))) / COLUMN_COUNT

// Hardcoded groups for UI structure
const GROUPS = [
  {
    title: 'Grocery & Kitchen',
    slugs: ['fruits-vegetables', 'dairy-bread-eggs', 'atta-rice-dal', 'meat-fish-eggs', 'masala-dry-fruits', 'breakfast-sauces', 'packaged-food']
  },
  {
    title: 'Snacks & Drinks',
    slugs: ['tea-coffee', 'ice-creams', 'frozen-food', 'sweet-cravings', 'cold-drinks', 'munchies', 'biscuits-cookies']
  },
  {
    title: 'Beauty & Personal Care',
    slugs: ['personal-care', 'skincare', 'makeup-beauty', 'fragrance', 'bath-body', 'haircare', 'baby-care']
  },
  {
    title: 'Fashion & Lifestyle',
    slugs: ['apparel', 'jewellery']
  }
]

export default function CategoriesScreen() {
  const router = useRouter()

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data.data.categories),
  })

  // Group the fetched categories according to our layout
  const groupedCategories = GROUPS.map(group => ({
    title: group.title,
    items: group.slugs
      .map(slug => categories?.find((c: any) => c.slug === slug))
      .filter(Boolean)
  })).filter(g => g.items.length > 0)

  // Append any uncategorized items to the bottom just in case
  const usedSlugs = new Set(GROUPS.flatMap(g => g.slugs))
  const otherCategories = categories?.filter((c: any) => !usedSlugs.has(c.slug)) || []
  if (otherCategories.length > 0) {
    groupedCategories.push({ title: 'More', items: otherCategories })
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Categories</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Heart size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/search')}>
            <Search size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {groupedCategories.map((group, idx) => (
            <View key={idx} style={styles.groupContainer}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              
              <View style={styles.grid}>
                {group.items.map((cat: any) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.itemCard}
                    onPress={() => router.push(`/category/${cat.slug}`)}
                  >
                    <View style={styles.itemImageBg}>
                      <Image source={{ uri: cat.imageUrl }} style={styles.itemImage as any} resizeMode="contain" />
                    </View>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: 'relative',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: '#000',
  },
  headerRight: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 12,
    flexDirection: 'row',
    gap: 16,
  },
  iconBtn: {
    padding: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 100, // Make room for tabs
  },
  groupContainer: {
    marginBottom: 32,
  },
  groupTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  itemCard: {
    width: ITEM_WIDTH,
    alignItems: 'center',
  },
  itemImageBg: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    backgroundColor: '#F5F6F8', // Light gray-blue background
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    padding: 12,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
    lineHeight: 18,
  },
})
