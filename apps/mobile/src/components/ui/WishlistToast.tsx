import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Check } from 'lucide-react-native'
import { ToastConfig } from 'react-native-toast-message'
import { colors, radius, fontSize } from '../../theme'

// Custom toast component for Wishlist
export const WishlistToastComponent = ({ text1, onPress }: { text1?: string, onPress?: () => void }) => (
  <View style={styles.toastContainer}>
    <View style={styles.content}>
      <View style={styles.iconCircle}>
        <Check size={14} color="#fff" strokeWidth={3} />
      </View>
      <Text style={styles.text}>{text1}</Text>
      <TouchableOpacity onPress={onPress}>
        <Text style={styles.viewText}>View</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.bottomLine} />
  </View>
)

export const toastConfig: ToastConfig = {
  wishlistToast: ({ text1, props }) => (
    <WishlistToastComponent 
      text1={text1} 
      onPress={props.onPress} 
    />
  ),
  // Default success fallback
  success: (props) => (
    <View style={[styles.toastContainer, { backgroundColor: '#10B981' }]}>
      <Text style={styles.text}>{props.text1}</Text>
    </View>
  ),
}

const styles = StyleSheet.create({
  toastContainer: {
    width: '90%',
    backgroundColor: '#1E293B', // Dark slate/gray
    borderRadius: radius.md,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  text: {
    flex: 1,
    color: '#fff',
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  viewText: {
    color: '#fff',
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  bottomLine: {
    height: 3,
    backgroundColor: colors.primary, // Pink accent line
    width: '100%',
  },
})
