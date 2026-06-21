import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, radius, fontSize } from '../../theme'

type Variant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'

interface BadgeProps {
  label: string
  variant?: Variant
  size?: 'sm' | 'md'
}

const variantColors: Record<Variant, { bg: string; text: string }> = {
  primary: { bg: '#dcfce7', text: '#15803d' },
  success: { bg: '#d1fae5', text: '#065f46' },
  warning: { bg: '#fef3c7', text: '#92400e' },
  danger: { bg: '#fee2e2', text: '#b91c1c' },
  info: { bg: '#dbeafe', text: '#1e40af' },
  default: { bg: '#f1f5f9', text: '#475569' },
}

export function Badge({ label, variant = 'default', size = 'md' }: BadgeProps) {
  const vc = variantColors[variant]
  return (
    <View style={[styles.badge, { backgroundColor: vc.bg }, size === 'sm' && styles.sm]}>
      <Text style={[styles.text, { color: vc.text }, size === 'sm' && styles.textSm]}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  sm: { paddingHorizontal: 7, paddingVertical: 2 },
  text: { fontSize: fontSize.sm, fontWeight: '600' },
  textSm: { fontSize: fontSize.xs },
})
