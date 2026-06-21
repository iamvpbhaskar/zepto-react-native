import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator
} from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import { queryClient } from '../../../lib/queryClient'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { colors, fontSize, spacing, radius, shadow } from '../../../theme'
import { MapPin, Plus, Trash2, Home, Briefcase, Info } from 'lucide-react-native'
import type { Address } from '@zepto/types'

export default function AddressScreen({ showFormByDefault = false }: { showFormByDefault?: boolean }) {
  const router = useRouter()
  const [showAddForm, setShowAddForm] = useState(showFormByDefault)
  const [label, setLabel] = useState('')
  const [type, setType] = useState<'HOME' | 'WORK' | 'OTHER'>('HOME')
  const [line1, setLine1] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [pincode, setPincode] = useState('')
  const [landmark, setLandmark] = useState('')

  const addressesQuery = useQuery({
    queryKey: ['addresses'],
    queryFn: () => api.get('/addresses').then(r => r.data.data.addresses as Address[]),
  } as any)

  const addAddressMutation = useMutation({
    mutationFn: (data: any) => api.post('/addresses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      setShowAddForm(false)
      // Reset form
      setLabel('')
      setType('HOME')
      setLine1('')
      setCity('')
      setState('')
      setPincode('')
      setLandmark('')
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.error?.message ?? 'Failed to add address')
    }
  })

  const deleteAddressMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/addresses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.error?.message ?? 'Failed to delete address')
    }
  })

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => api.put(`/addresses/${id}/default`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
    }
  })

  const handleAddAddress = () => {
    if (!label || !line1 || !city || !state || !pincode) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }
    addAddressMutation.mutate({
      label,
      type,
      line1,
      city,
      state,
      pincode,
      landmark: landmark || undefined,
      isDefault: addresses.length === 0, // make default if it is first address
    })
  }

  const handleDelete = (id: string) => {
    Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
      { text: 'No' },
      { text: 'Yes, Delete', style: 'destructive', onPress: () => deleteAddressMutation.mutate(id) }
    ])
  }

  const addresses = (addressesQuery.data as Address[]) ?? []

  const getIconForType = (addrType: string) => {
    switch (addrType) {
      case 'HOME': return <Home size={16} color={colors.primary} />
      case 'WORK': return <Briefcase size={16} color={colors.primary} />
      default: return <Info size={16} color={colors.primary} />
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        {showAddForm ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Add New Address</Text>
            
            <Input
              label="Address Label (e.g., My Home, Office)*"
              placeholder="e.g. Dad's House"
              value={label}
              onChangeText={setLabel}
            />

            <Text style={styles.labelSelectTitle}>Address Type*</Text>
            <View style={styles.typeRow}>
              {(['HOME', 'WORK', 'OTHER'] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, type === t && styles.typeBtnSelected]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextSelected]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Flat, House no., Building, Apartment*"
              placeholder="e.g. Flat 402, Alpine Crest"
              value={line1}
              onChangeText={setLine1}
            />

            <Input
              label="Landmark (Optional)"
              placeholder="e.g. Near Star Mall"
              value={landmark}
              onChangeText={setLandmark}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Input
                  label="City*"
                  placeholder="e.g. Bangalore"
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="State*"
                  placeholder="e.g. Karnataka"
                  value={state}
                  onChangeText={setState}
                />
              </View>
            </View>

            <Input
              label="Pincode*"
              placeholder="6-digit pincode"
              keyboardType="number-pad"
              maxLength={6}
              value={pincode}
              onChangeText={setPincode}
            />

            <View style={styles.formActions}>
              <Button
                title="Save Address"
                onPress={handleAddAddress}
                loading={addAddressMutation.isPending}
                size="md"
              />
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowAddForm(false)}
                size="md"
              />
            </View>
          </View>
        ) : (
          <>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddForm(true)}>
              <Plus size={18} color={colors.primary} />
              <Text style={styles.addBtnText}>Add New Address</Text>
            </TouchableOpacity>

            {addressesQuery.isLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
            ) : addresses.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MapPin size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>No saved addresses found</Text>
              </View>
            ) : (
              <View style={styles.addressList}>
                {addresses.map(addr => (
                  <View key={addr.id} style={styles.addressCard}>
                    <View style={styles.addressHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {getIconForType(addr.type)}
                        <Text style={styles.addressLabel}>{addr.label}</Text>
                      </View>
                      <View style={styles.actionRow}>
                        {!addr.isDefault && (
                          <TouchableOpacity onPress={() => setDefaultMutation.mutate(addr.id)}>
                            <Text style={styles.defaultActionText}>Set Default</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => handleDelete(addr.id)}>
                          <Trash2 size={16} color={colors.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.addressText}>{addr.line1}</Text>
                    <Text style={styles.addressText}>{addr.city}, {addr.state} - {addr.pincode}</Text>
                    {addr.landmark && <Text style={styles.landmarkText}>Landmark: {addr.landmark}</Text>}
                    
                    {addr.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default Address</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: spacing.base, gap: spacing.base },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed',
    borderRadius: radius.xl, padding: 14, ...shadow.sm,
  },
  addBtnText: { color: colors.primary, fontWeight: '700', fontSize: fontSize.base },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { color: colors.textSecondary, fontSize: fontSize.base },
  addressList: { gap: 12 },
  addressCard: {
    backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing.base, gap: 8, ...shadow.sm,
  },
  addressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addressLabel: { fontSize: fontSize.base, fontWeight: '700', color: colors.text },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  defaultActionText: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '600' },
  addressText: { fontSize: fontSize.sm, color: colors.textSecondary },
  landmarkText: { fontSize: fontSize.xs, color: colors.textMuted },
  defaultBadge: {
    backgroundColor: '#dcfce7', alignSelf: 'flex-start', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2, marginTop: 4,
  },
  defaultBadgeText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.primaryDark },
  formCard: { backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing.base, gap: 12, ...shadow.sm },
  formTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, marginBottom: 4 },
  labelSelectTitle: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary, marginTop: 4 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  typeBtn: {
    flex: 1, paddingVertical: 10, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md, alignItems: 'center',
  },
  typeBtnSelected: { borderColor: colors.primary, backgroundColor: '#f0fdf4' },
  typeBtnText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
  typeBtnTextSelected: { color: colors.primary },
  row: { flexDirection: 'row', gap: 10 },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
})
