import React from 'react'
import { View, StyleSheet, Animated } from 'react-native'
import { colors, radius } from '../../theme'

interface SkeletonProps {
  width?: number | string
  height?: number
  borderRadius?: number
  style?: object
}

export function Skeleton({ width = '100%', height = 16, borderRadius = radius.sm, style }: SkeletonProps) {
  const opacity = React.useRef(new Animated.Value(1)).current

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    )
    animation.start()
    return () => animation.stop()
  }, [])

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as any, height, borderRadius, opacity },
        style,
      ]}
    />
  )
}

export function ProductSkeleton({ style }: { style?: any }) {
  return (
    <View style={[styles.productCard, style]}>
      <Skeleton height={120} borderRadius={12} />
      <View style={{ marginTop: 8, gap: 6 }}>
        <Skeleton height={14} width="80%" />
        <Skeleton height={12} width="50%" />
        <Skeleton height={16} width="40%" />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  skeleton: { backgroundColor: colors.border },
  productCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 12,
  },
})
