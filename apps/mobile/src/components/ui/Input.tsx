import React from 'react'
import {
  TextInput, View, Text, StyleSheet, type TextInputProps, type ViewStyle
} from 'react-native'
import { colors, radius, fontSize } from '../../theme'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  containerStyle?: ViewStyle
}

export function Input({
  label, error, leftIcon, rightIcon, containerStyle, style, ...rest
}: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        {leftIcon ? <View style={styles.icon}>{leftIcon as any}</View> : null}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          {...rest}
        />
        {rightIcon ? <View style={styles.icon}>{rightIcon as any}</View> : null}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  inputError: { borderColor: colors.danger },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: fontSize.base,
    color: colors.text,
  },
  icon: { paddingHorizontal: 12 },
  error: { fontSize: fontSize.xs, color: colors.danger },
})
