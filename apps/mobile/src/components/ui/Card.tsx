import React from 'react'
import { View, StyleSheet, type ViewProps } from 'react-native'
import { colors, radius, shadow } from '../../theme'

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outline'
}

export function Card({ variant = 'default', style, children, ...rest }: CardProps) {
  return (
    <View
      style={[
        styles.base,
        variant === 'elevated' && styles.elevated,
        variant === 'outline' && styles.outline,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
  },
  elevated: {
    ...shadow.md,
  },
  outline: {
    borderWidth: 1,
    borderColor: colors.border,
  },
})
