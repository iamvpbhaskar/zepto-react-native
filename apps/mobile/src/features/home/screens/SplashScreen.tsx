import React, { useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, Animated, Dimensions
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../../auth/store/auth.store'
import { colors } from '../../../theme'

const { width, height } = Dimensions.get('window')

export default function SplashScreen() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  const scale = useRef(new Animated.Value(0.5)).current
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(20)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start()

    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.replace('/(tabs)')
      } else {
        router.replace('/login')
      }
    }, 2200)

    return () => clearTimeout(timer)
  }, [])

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity, transform: [{ scale }, { translateY }] }]}>
        <View style={styles.logoBox}>
          <Text style={styles.logoEmoji}>⚡</Text>
        </View>
        <Text style={styles.appName}>Zepto</Text>
        <Text style={styles.tagline}>10-minute grocery delivery</Text>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary, // Zepto Deep Purple
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { alignItems: 'center', gap: 12 },
  logoBox: {
    width: 96,
    height: 96,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoEmoji: { fontSize: 52 },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
})
