import React, { useRef, useState } from 'react'
import {
  View, Text, StyleSheet, TextInput, Pressable, type ViewStyle
} from 'react-native'
import { colors, radius, fontSize, spacing } from '../../../theme'

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  style?: ViewStyle
}

export function OtpInput({ value, onChange, length = 6, style }: OtpInputProps) {
  const inputRef = useRef<TextInput>(null)
  const [isFocused, setIsFocused] = useState(false)

  const handlePress = () => {
    inputRef.current?.focus()
  }

  const codeChars = Array(length).fill('')

  return (
    <View style={[styles.container, style]}>
      {/* Hidden TextInput for native text handling */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text: string) => onChange(text.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        style={styles.hiddenInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
      />

      {/* Styled boxes grid */}
      <Pressable style={styles.grid} onPress={handlePress}>
        {codeChars.map((_, index) => {
          const char = value[index] || ''
          const isCurrentChar = index === value.length
          const isLastChar = index === length - 1 && value.length === length
          const highlightBox = isFocused && (isCurrentChar || isLastChar)

          return (
            <View
              key={index}
              style={[
                styles.box,
                char !== '' && styles.boxFilled,
                highlightBox && styles.boxHighlighted
              ]}
            >
              <Text style={[styles.boxText, highlightBox && styles.boxTextHighlighted]}>
                {char}
              </Text>
            </View>
          )
        })}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 320,
    gap: 8,
  },
  box: {
    flex: 1,
    aspectRatio: 1, // Make it a circle/square
    height: 50,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  boxFilled: {
    borderColor: 'transparent',
  },
  boxHighlighted: {
    borderColor: '#4ade80', // Green border for active
    backgroundColor: '#fff',
  },
  boxText: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: '#000',
  },
  boxTextHighlighted: {
    color: '#000',
  },
})
