import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useFocusEffect, useRouter } from 'expo-router'
import React, { useCallback, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase/firebase'
import { LogoutConfirmModal } from '../../components/LogoutConfirmModal'
import { getBranchById } from '../../database/services/branchService'
import { getBranchOrders } from '../../database/services/orderService'
import { getCurrentStaffProfile } from '../../database/services/staffAuthenticationService'
import type { Order } from '../../database/models/Order'

function StaffNav({ active, router, onLogout }: { active: string; router: ReturnType<typeof useRouter>; onLogout: () => void }) {
  return <View style={styles.nav}>{[['home', 'home', 'Home'], ['orders', 'receipt', 'Orders'], ['payment', 'card', 'Records']].map(([key, icon, label]) => <Pressable key={key} onPress={() => router.replace(`/staff/${key}`)} style={styles.navItem}><Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={active === key ? '#0877C8' : '#71879A'} /><Text style={[styles.navLabel, active === key && styles.active]}>{label}</Text></Pressable>)}<Pressable onPress={onLogout} style={styles.navItem}><Ionicons name="log-out-outline" size={20} color="#71879A" /><Text style={styles.navLabel}>Log Out</Text></Pressable></View>
}

export default function StaffHome() {
  const router = useRouter()
  const [profile, setProfile] = useState<{ fullName: string; branchId: string } | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [error, setError] = useState('')
  const [showLogout, setShowLogout] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useFocusEffect(useCallback(() => {
    let mounted = true
    async function load() {
      try {
        const staffProfile = await getCurrentStaffProfile()
        const [branchOrders, branch] = await Promise.all([getBranchOrders(staffProfile.branchId), getBranchById(staffProfile.branchId)])
        if (mounted) {
          setProfile({ fullName: staffProfile.fullName, branchId: branch?.name || staffProfile.branchId })
          setOrders(branchOrders)
          setError('')
        }
      } catch { if (mounted) setError('Could not load your branch orders. Check your connection and try again.') }
    }
    void load()
    return () => { mounted = false }
  }, []))

  const firstName = profile?.fullName.trim().split(/\s+/)[0] || 'Staff'
  const washing = orders.filter((order) => order.status === 'washing').length
  const completed = orders.filter((order) => order.status === 'completed').length
  const dropOffs = orders.filter((order) => order.status === 'pending_dropoff' || order.status === 'received').slice(0, 3)
  const handleLogout = async () => { setLoggingOut(true); try { await signOut(auth); router.replace('/staff/login') } finally { setLoggingOut(false); setShowLogout(false) } }

  return <View style={styles.screen}><LinearGradient colors={['#BEE9FF', '#F7FCFF', '#FFFFFF']} style={StyleSheet.absoluteFill} /><SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><View style={styles.header}><Image source={require('../../assets/img/logo.png')} style={styles.logo} resizeMode="contain" /><View><Text style={styles.brand}>WashWise</Text><Text style={styles.role}>Staff Panel</Text></View><Ionicons name="notifications-outline" size={21} color="#176A9E" style={styles.bell} /></View><Text style={styles.greeting}>Hello, {firstName}!</Text><Text style={styles.caption}>{profile?.branchId || 'Loading branch...'}</Text><View style={styles.summary}><Text style={styles.summaryTitle}>Today's Summary</Text><View style={styles.summaryRow}><View><Text style={styles.bigNumber}>{washing}</Text><Text style={styles.summaryLabel}>Washing</Text></View><View style={styles.completed}><Text style={styles.bigNumber}>{completed}</Text><Text style={styles.summaryLabel}>Completed</Text></View></View></View>{!!error && <Text style={styles.error}>{error}</Text>}<View style={styles.sectionRow}><Text style={styles.sectionTitle}>New Drop-offs</Text><Pressable onPress={() => router.replace('/staff/orders')}><Text style={styles.link}>See All</Text></Pressable></View>{dropOffs.length === 0 ? <Text style={styles.empty}>No new drop-offs for this branch.</Text> : dropOffs.map((order) => <View key={order.orderId} style={styles.orderCard}><View style={styles.orderIcon}><Ionicons name="receipt" size={18} color="#0877C8" /></View><View style={styles.orderCopy}><Text style={styles.orderId}>{order.orderId}</Text><Text style={styles.orderMeta}>Customer: {order.customerId}</Text><Text style={styles.orderMeta}>{order.serviceType || 'Laundry service'} • {order.priority || 'Regular'}</Text></View><View style={styles.chip}><Text style={styles.chipText}>{order.status === 'received' ? 'Received' : 'Drop-off'}</Text></View></View>)}</ScrollView><StaffNav active="home" router={router} onLogout={() => setShowLogout(true)} /></SafeAreaView><LogoutConfirmModal visible={showLogout} loading={loggingOut} onCancel={() => setShowLogout(false)} onConfirm={() => void handleLogout()} /></View>
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#FFFFFF' }, safe: { flex: 1 }, content: { width: '100%', maxWidth: 420, alignSelf: 'center', padding: 12, paddingBottom: 18 }, header: { flexDirection: 'row', alignItems: 'center' }, logo: { width: 43, height: 38 }, brand: { color: '#075191', fontSize: 14, fontWeight: '800' }, role: { color: '#6B879B', fontSize: 7 }, bell: { marginLeft: 'auto' }, greeting: { color: '#075191', fontSize: 20, fontWeight: '800', marginTop: 22 }, caption: { color: '#6B879B', fontSize: 8, marginTop: 2 }, summary: { marginTop: 17, padding: 12, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.88)', borderWidth: 1, borderColor: '#D3E3EC' }, summaryTitle: { color: '#075191', fontSize: 10, fontWeight: '800' }, summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 }, completed: { paddingLeft: 45, borderLeftWidth: 1, borderLeftColor: '#D9E6ED' }, bigNumber: { color: '#0877C8', fontSize: 22, fontWeight: '800' }, summaryLabel: { color: '#668395', fontSize: 8 }, sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 6 }, sectionTitle: { color: '#075191', fontSize: 11, fontWeight: '800' }, link: { color: '#0877C8', fontSize: 8, fontWeight: '700' }, orderCard: { minHeight: 62, flexDirection: 'row', alignItems: 'center', padding: 8, marginBottom: 7, borderRadius: 7, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D3E3EC' }, orderIcon: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 5, backgroundColor: '#E1F3FF' }, orderCopy: { flex: 1, marginLeft: 8 }, orderId: { color: '#075191', fontSize: 9, fontWeight: '800' }, orderMeta: { color: '#6B879B', fontSize: 7, marginTop: 2 }, chip: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, backgroundColor: '#E1F3FF' }, chipText: { color: '#0877C8', fontSize: 6, fontWeight: '800' }, empty: { color: '#6B879B', fontSize: 9, marginTop: 4 }, error: { color: '#AF3546', backgroundColor: '#FFF0F1', borderRadius: 6, padding: 9, fontSize: 9, marginTop: 10 }, nav: { minHeight: 57, flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#B6DDEF' }, navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 }, navLabel: { color: '#71879A', fontSize: 7 }, active: { color: '#0877C8', fontWeight: '800' } })
