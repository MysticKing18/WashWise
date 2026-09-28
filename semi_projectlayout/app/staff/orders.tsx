import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase/firebase'
import { LogoutConfirmModal } from '../../components/LogoutConfirmModal'
import { getBranchById } from '../../database/services/branchService'
import { getStaffByBranch } from '../../database/services/staffService'
import { getBranchOrders, updateBranchOrderStatus } from '../../database/services/orderService'
import { getCurrentStaffProfile } from '../../database/services/staffAuthenticationService'
import type { Order, OrderStatus } from '../../database/models/Order'

type Filter = 'all' | 'pending_dropoff' | 'received' | 'washing' | 'completed' | 'cancelled'
function Nav({ active, router, onLogout }: { active: string; router: ReturnType<typeof useRouter>; onLogout: () => void }) { return <View style={styles.nav}>{[['home', 'home', 'Home'], ['orders', 'receipt', 'Orders'], ['payment', 'card', 'Records']].map(([key, icon, label]) => <Pressable key={key} onPress={() => router.replace(`/staff/${key}`)} style={styles.navItem}><Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={active === key ? '#0877C8' : '#71879A'} /><Text style={[styles.navLabel, active === key && styles.active]}>{label}</Text></Pressable>)}<Pressable onPress={onLogout} style={styles.navItem}><Ionicons name="log-out-outline" size={20} color="#71879A" /><Text style={styles.navLabel}>Log Out</Text></Pressable></View> }

const labelFor = (status: OrderStatus) => status === 'pending_dropoff' ? 'Drop-off' : status.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
const nextAction = (status: OrderStatus): { label: string; next: OrderStatus } | null => status === 'pending_dropoff' || status === 'received' ? { label: 'Mark Washing', next: 'washing' } : status === 'washing' ? { label: 'Mark Completed', next: 'completed' } : null

export default function StaffOrders() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [branchName, setBranchName] = useState('Assigned Branch')
  const [branchId, setBranchId] = useState('')
  const [branchStaff, setBranchStaff] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [showLogout, setShowLogout] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const loadOrders = async () => {
    setLoading(true); setError('')
    try {
      const profile = await getCurrentStaffProfile()
      const [branchOrders, branch, assignedStaff] = await Promise.all([getBranchOrders(profile.branchId), getBranchById(profile.branchId), getStaffByBranch(profile.branchId)])
      setBranchId(profile.branchId); setBranchName(branch?.name || profile.branchId); setBranchStaff(assignedStaff.filter((staff) => staff.isActive && staff.role === 'staff').map((staff) => staff.fullName)); setOrders(branchOrders)
    } catch { setError('Could not load orders for your assigned branch. Check your connection and try again.') }
    finally { setLoading(false) }
  }

  useEffect(() => { void loadOrders() }, [])

  const visibleOrders = useMemo(() => orders.filter((order) => {
    const searchable = `${order.orderId} ${order.customerId} ${order.serviceType || ''}`.toLowerCase()
    return searchable.includes(search.trim().toLowerCase()) && (filter === 'all' || order.status === filter)
  }), [filter, orders, search])

  const changeStatus = async (order: Order, status: OrderStatus) => {
    if (!branchId) return
    setUpdatingId(order.orderId); setError('')
    try {
      await updateBranchOrderStatus(order.orderId, branchId, status)
      setOrders((items) => items.map((item) => item.orderId === order.orderId ? { ...item, status } : item))
    } catch { setError('This order could not be updated. It may belong to another branch or no longer allow this status change.') }
    finally { setUpdatingId(null) }
  }

  const handleLogout = async () => { setLoggingOut(true); try { await signOut(auth); router.replace('/staff/login') } finally { setLoggingOut(false); setShowLogout(false) } }

  return <View style={styles.screen}><LinearGradient colors={['#BEE9FF', '#F7FCFF', '#FFFFFF']} style={StyleSheet.absoluteFill} /><SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}><View style={styles.header}><Image source={require('../../assets/img/logo.png')} style={styles.logo} resizeMode="contain" /><View style={styles.heading}><Text style={styles.brand}>Branch Orders</Text><Text style={styles.role}>{branchName}</Text></View><Pressable onPress={() => void loadOrders()} accessibilityLabel="Refresh orders"><Ionicons name="refresh-outline" size={19} color="#0877C8" /></Pressable></View><Text style={styles.managers}>Managed by: {branchStaff.length ? branchStaff.join(', ') : 'No active branch staff assigned'}</Text><View style={styles.search}><Ionicons name="search-outline" size={16} color="#7590A1" /><TextInput value={search} onChangeText={setSearch} placeholder="Search order or customer" placeholderTextColor="#94A4AE" style={styles.searchInput} /></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>{(['all', 'pending_dropoff', 'received', 'washing', 'completed', 'cancelled'] as Filter[]).map((value) => <Pressable key={value} onPress={() => setFilter(value)} style={[styles.filterButton, filter === value && styles.filterActive]}><Text style={[styles.filterText, filter === value && styles.filterTextActive]}>{value === 'all' ? 'All' : labelFor(value)}</Text></Pressable>)}</ScrollView>{!!error && <Text style={styles.error}>{error}</Text>}{loading ? <Text style={styles.empty}>Loading branch orders...</Text> : visibleOrders.length === 0 ? <Text style={styles.empty}>No orders match this branch and filter.</Text> : visibleOrders.map((order) => { const action = nextAction(order.status); return <View key={order.orderId} style={styles.card}><View style={styles.icon}><Ionicons name="receipt" size={17} color="#0877C8" /></View><View style={styles.copy}><Text style={styles.id}>{order.orderId}</Text><Text style={styles.name}>Customer: {order.customerId}</Text><Text style={styles.meta}>{order.serviceType || 'Laundry service'} • {order.priority || 'Regular'}</Text><View style={[styles.status, order.status === 'completed' ? styles.completed : order.status === 'cancelled' ? styles.cancelled : styles.processing]}><Text style={styles.statusText}>{labelFor(order.status)}</Text></View>{action && <Pressable disabled={updatingId === order.orderId} onPress={() => void changeStatus(order, action.next)} style={styles.action}><Text style={styles.actionText}>{updatingId === order.orderId ? 'Saving...' : action.label}</Text></Pressable>}</View></View> })}</ScrollView><Nav active="orders" router={router} onLogout={() => setShowLogout(true)} /></SafeAreaView><LogoutConfirmModal visible={showLogout} loading={loggingOut} onCancel={() => setShowLogout(false)} onConfirm={() => void handleLogout()} /></View>
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#FFFFFF' }, safe: { flex: 1 }, content: { width: '100%', maxWidth: 420, alignSelf: 'center', padding: 11, paddingBottom: 18 }, header: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 }, heading: { flex: 1, marginLeft: 8 }, logo: { width: 44, height: 38 }, brand: { color: '#075191', fontSize: 15, fontWeight: '800' }, role: { color: '#6B879B', fontSize: 7, marginTop: 2 }, managers: { color: '#527B9A', fontSize: 8, marginBottom: 10 }, search: { height: 34, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, borderRadius: 5, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D3E3EC' }, searchInput: { flex: 1, color: '#264C63', fontSize: 9 }, filterRow: { gap: 6, paddingVertical: 8 }, filterButton: { paddingHorizontal: 9, height: 27, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D3E3EC' }, filterActive: { backgroundColor: '#DDF1FF', borderColor: '#6DB7E8' }, filterText: { color: '#668395', fontSize: 8 }, filterTextActive: { color: '#0877C8', fontWeight: '800' }, error: { color: '#AF3546', backgroundColor: '#FFF0F1', borderRadius: 6, padding: 9, fontSize: 9, marginBottom: 8 }, empty: { color: '#6B879B', fontSize: 9, textAlign: 'center', marginTop: 24 }, card: { minHeight: 92, flexDirection: 'row', padding: 8, marginTop: 8, borderRadius: 7, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D3E3EC' }, icon: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 5, backgroundColor: '#E1F3FF' }, copy: { flex: 1, marginLeft: 8 }, id: { color: '#075191', fontSize: 9, fontWeight: '800' }, name: { color: '#395E73', fontSize: 8, marginTop: 2 }, meta: { color: '#79909E', fontSize: 7, marginTop: 3 }, status: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 3, marginTop: 6, borderRadius: 6 }, processing: { backgroundColor: '#D7F0FF' }, completed: { backgroundColor: '#D5F3E1' }, cancelled: { backgroundColor: '#FFE2E2' }, statusText: { color: '#0877C8', fontSize: 6, fontWeight: '800' }, action: { alignSelf: 'flex-start', height: 25, justifyContent: 'center', paddingHorizontal: 8, marginTop: 7, borderRadius: 5, backgroundColor: '#0877C8' }, actionText: { color: '#FFFFFF', fontSize: 7, fontWeight: '800' }, nav: { minHeight: 57, flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#B6DDEF' }, navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 }, navLabel: { color: '#71879A', fontSize: 7 }, active: { color: '#0877C8', fontWeight: '800' } })