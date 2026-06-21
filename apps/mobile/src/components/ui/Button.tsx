import React from 'react'
import {
  TouchableOpacity, Text, StyleSheet, ActivityIndicator,
  type TouchableOpacityProps, type ViewStyle, type TextStyle
} from 'react-native'
import { colors, radius, fontSize, fontWeight } from '../../theme'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends TouchableOpacityProps {
  title: string
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
}

const variantStyles: Record<Variant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: colors.primary },
    text: { color: colors.textInverse },
  },
  secondary: {
    container: { backgroundColor: colors.secondary },
    text: { color: colors.textInverse },
  },
  outline: {
    container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
    text: { color: colors.primary },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: colors.primary },
  },
  danger: {
    container: { backgroundColor: colors.danger },
    text: { color: colors.textInverse },
  },
}

const sizeStyles: Record<Size, { container: ViewStyle; text: TextStyle }> = {
  sm: { container: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: radius.md }, text: { fontSize: fontSize.sm } },
  md: { container: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: radius.md }, text: { fontSize: fontSize.base } },
  lg: { container: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: radius.lg }, text: { fontSize: fontSize.md } },
}

export function Button({
  title, variant = 'primary', size = 'md', loading = false, icon, style, disabled, ...rest
}: ButtonProps) {
  const vs = variantStyles[variant]
  const ss = sizeStyles[size]

  return (
    <TouchableOpacity
      style={[
        styles.base,
        vs.container,
        ss.container,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={vs.text.color as string} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, vs.text, ss.text]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontWeight: fontWeight.semibold as any,
  },
  disabled: {
    opacity: 0.6,
  },
})
