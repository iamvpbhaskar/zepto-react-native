import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Alert, TextInput, StatusBar
} from 'react-native'
import { useRouter } from 'expo-router'
import { api } from '../../../lib/api'
import { useAuthStore } from '../store/auth.store'
import { OtpInput } from '../components/OtpInput'
import { OtpTimer } from '../components/OtpTimer'
import { colors, fontSize, spacing, radius } from '../../../theme'
import { ChevronLeft } from 'lucide-react-native'

export default function LoginScreen() {
  const router = useRouter()
  const login = useAuthStore(s => s.login)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)

  const handleSendOtp = async () => {
    if (phone.length !== 10) return
    setLoading(true)
    try {
      await api.post('/auth/send-otp', { phone })
      setStep('otp')
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message ?? 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return
    setLoading(true)
    try {
      const res = await api.post('/auth/verify-otp', { phone, otp })
      const { user, accessToken, refreshToken } = res.data.data
      await login(user, { accessToken, refreshToken })
      router.replace('/(tabs)')
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message ?? 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  // Auto trigger verify if 6 digits
  React.useEffect(() => {
    if (otp.length === 6) {
      handleVerifyOtp()
    }
  }, [otp])

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#4A154B' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {step === 'phone' ? (
          <>
            <View style={styles.skipRow}>
              <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.skipBtn}>
                <Text style={styles.skipText}>Skip {'>'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.phoneHeader}>
              <Text style={styles.zeptoLogo}>zepto</Text>
              <Text style={styles.phoneTitle}>Everyday Low Prices</Text>
              <Text style={styles.phoneTitle}>in minutes</Text>
            </View>

            <View style={styles.phoneForm}>
              <View style={styles.phoneInputBox}>
                <Text style={styles.prefix}>+91</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Enter Phone Number"
                  placeholderTextColor={colors.textMuted}
                  value={phone}
                  onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              <TouchableOpacity 
                style={[styles.continueBtn, phone.length !== 10 && { opacity: 0.7 }]} 
                onPress={handleSendOtp}
                disabled={phone.length !== 10 || loading}
              >
                <Text style={styles.continueBtnText}>Continue</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>By continuing, you agree to our</Text>
              <Text style={styles.footerText}>
                <Text style={styles.footerLink}>Terms of Use</Text> & <Text style={styles.footerLink}>Privacy Policy</Text>
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.otpHeaderRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => { setStep('phone'); setOtp(''); }}>
                <ChevronLeft size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.otpHeader}>
              <Text style={styles.otpTitle}>OTP</Text>
              <Text style={styles.otpTitle}>Verification</Text>
              <Text style={styles.otpSubtitle}>OTP has been sent to <Text style={{ fontWeight: 'bold' }}>+91 {phone}</Text></Text>
            </View>

            <View style={styles.otpForm}>
              <Text style={styles.otpLabel}>Enter 6 Digit OTP</Text>
              <OtpInput value={otp} onChange={setOtp} />
              
              <OtpTimer onResend={handleSendOtp} />
              
              {loading && <Text style={[styles.otpLabel, { marginTop: 10 }]}>Verifying...</Text>}
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#4A154B', // Exact Zepto deep purple
    paddingHorizontal: spacing.xl,
    paddingTop: 80,
    paddingBottom: 40,
  },
  
  // PHONE STEP STYLES
  skipRow: {
    alignItems: 'flex-end',
    marginBottom: 40,
  },
  skipBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  skipText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: fontSize.sm,
  },
  phoneHeader: {
    marginBottom: 60,
  },
  zeptoLogo: {
    fontSize: 64,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -2,
    marginBottom: 20,
  },
  phoneTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 40,
  },
  phoneForm: {
    flex: 1,
  },
  phoneInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 28,
    height: 56,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  prefix: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: '#000',
    marginRight: 24,
  },
  phoneInput: {
    flex: 1,
    fontSize: fontSize.lg,
    color: '#000',
    height: '100%',
  },
  continueBtn: {
    backgroundColor: colors.primary, // The zepto pink
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    color: '#fff',
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    color: '#fff',
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  footerLink: {
    color: colors.primary,
  },

  // OTP STEP STYLES
  otpHeaderRow: {
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpHeader: {
    marginBottom: 40,
  },
  otpTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 44,
  },
  otpSubtitle: {
    fontSize: fontSize.base,
    color: '#fff',
    marginTop: 12,
  },
  otpForm: {
    flex: 1,
  },
  otpLabel: {
    color: '#fff',
    fontSize: fontSize.base,
    fontWeight: '600',
    marginBottom: 10,
  },
})
