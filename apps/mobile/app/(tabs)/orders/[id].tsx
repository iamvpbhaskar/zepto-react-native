import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import OrderDetailScreen from '../../../src/features/orders/screens/OrderDetailScreen'
import OrderSuccessScreen from '../../../src/features/orders/screens/OrderSuccessScreen'

export default function OrderPage() {
  const { success } = useLocalSearchParams<{ success?: string }>()

  if (success === 'true') {
    return <OrderSuccessScreen />
  }

  return <OrderDetailScreen />
}
