import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useOtpTimer } from '../hooks/useOtpTimer'
import { colors, fontSize, spacing } from '../../../theme'
import { MessageCircle } from 'lucide-react-native'

interface OtpTimerProps {
  onResend: () => void
  initialSeconds?: number
}

export function OtpTimer({ onResend, initialSeconds = 60 }: OtpTimerProps) {
  const { secondsLeft, canResend, resetTimer } = useOtpTimer(initialSeconds)

  const handleResend = () => {
    resetTimer()
    onResend()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins < 10 ? '0' : ''}${mins} : ${secs < 10 ? '0' : ''}${secs}`
  }

  return (
    <View style={styles.container}>
      {!canResend && (
        <Text style={styles.timeValue}>{formatTime(secondsLeft)}</Text>
      )}
      <View style={styles.resendRow}>
        <Text style={styles.infoText}>Didn't get it?</Text>
        <TouchableOpacity onPress={handleResend} activeOpacity={0.7} disabled={!canResend} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MessageCircle size={16} color={!canResend ? 'rgba(255,255,255,0.5)' : '#fff'} />
          <Text style={[styles.resendText, !canResend && { opacity: 0.5 }]}>Send OTP (SMS)</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    marginVertical: spacing.sm,
    gap: 16,
  },
  timeValue: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: '#fff',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: fontSize.base,
    color: '#fff',
  },
  resendText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: '#fff',
    textDecorationLine: 'underline',
  },
})
