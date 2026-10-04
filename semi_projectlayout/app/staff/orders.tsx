import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase/firebase'
import { LogoutConfirmModal } from '../../components/LogoutConfirmModal'
import { getBranchById } from '../../database/services/branchService'
import { getStaffByBranch } from '../../database/services/staffService'
import { cancelOrder, getBranchOrders, updateBranchOrderStatus, updateVerifiedOrderDetails } from '../../database/services/orderService'
import { getCurrentStaffProfile } from '../../database/services/staffAuthenticationService'
import { getUserById } from '../../database/services/userService'
import { createPayment, getPaymentByOrder } from '../../database/services/paymentService'
import type { Order, OrderStatus } from '../../database/models/Order'
import type { User } from '../../database/models/User'

type Filter = 'all' | 'pending_dropoff' | 'received' | 'washing' | 'completed' | 'cancelled'

type ReviewModalProps = {
  visible: boolean
  order: Order | null
  customer: User | null
  branchName: string
  staffName: string
  amount: string
  loading: boolean
  error: string
  onAmountChange: (value: string) => void
  onCancel: () => void
  onReceive: () => void
}

function Nav({ active, router, onLogout }: { active: string; router: ReturnType<typeof useRouter>; onLogout: () => void }) {
  const items = [['home', 'home', 'Home'], ['orders', 'receipt', 'Orders'], ['payment', 'card', 'Records']]
  return <View style={styles.nav}>{items.map(([key, icon, label]) => <Pressable key={key} onPress={() => router.replace(`/staff/${key}`)} style={styles.navItem}><Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={active === key ? '#0877C8' : '#71879A'} /><Text style={[styles.navLabel, active === key && styles.active]}>{label}</Text></Pressable>)}<Pressable onPress={onLogout} style={styles.navItem}><Ionicons name="log-out-outline" size={20} color="#71879A" /><Text style={styles.navLabel}>Log Out</Text></Pressable></View>
}

const labelFor = (status: OrderStatus) => status === 'pending_dropoff' ? 'Pending Drop-off' : status.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
const formatAmount = (amount?: number) => amount === undefined ? 'Not set' : `P${amount.toFixed(2)}`
const nextAction = (status: OrderStatus): { label: string; next: OrderStatus } | null => status === 'pending_dropoff' ? { label: 'Review & Receive', next: 'received' } : status === 'received' ? { label: 'Mark Washing', next: 'washing' } : status === 'washing' ? { label: 'Mark Completed', next: 'completed' } : null

function OrderReviewModal({ visible, order, customer, branchName, staffName, amount, loading, error, onAmountChange, onCancel, onReceive }: ReviewModalProps) {
  if (!order) return null
  return <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalCard}>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <View style={styles.modalIcon}><Ionicons name="receipt-outline" size={28} color="#0877C8" /></View>
          <Text style={styles.modalTitle}>Review Drop-off</Text>
          <Text style={styles.modalSubtitle}>Verify the order before receiving it.</Text>
          <View style={styles.detailGroup}><Text style={styles.detailLabel}>Customer</Text><Text style={styles.detailValue}>{customer?.fullName?.trim() || 'Customer name unavailable'}</Text>{customer?.email ? <Text style={styles.detailSecondary}>{customer.email}</Text> : null}{customer?.phone ? <Text style={styles.detailSecondary}>{customer.phone}</Text> : null}</View>
          <View style={styles.detailGroup}><Text style={styles.detailLabel}>Branch</Text><Text style={styles.detailValue}>{branchName}</Text><Text style={styles.detailSecondary}>Order reference: {order.orderId}</Text></View>
          <View style={styles.detailGroup}><Text style={styles.detailLabel}>Receiving staff</Text><Text style={styles.detailValue}>{staffName}</Text></View>
          <View style={styles.detailGroup}><Text style={styles.detailLabel}>Selected service</Text><Text style={styles.detailValue}>{order.serviceType || 'Laundry service'}</Text><Text style={styles.detailSecondary}>{order.priority === 'rush' ? 'Rush priority' : 'Regular priority'}</Text></View>
          <View style={styles.detailGroup}><Text style={styles.detailLabel}>Laundry details</Text><Text style={styles.detailValue}>{order.laundryDetails || 'No additional details provided.'}</Text></View>
          <View style={styles.amountGroup}><Text style={styles.detailLabel}>Final amount</Text><TextInput value={amount} onChangeText={onAmountChange} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#94A4AE" style={styles.amountInput} /></View>
          {!!error && <Text style={styles.modalError}>{error}</Text>}
          <View style={styles.modalActions}><Pressable disabled={loading} onPress={onCancel} style={styles.modalCancel}><Text style={styles.modalCancelText}>Cancel</Text></Pressable><Pressable disabled={loading} onPress={onReceive} style={styles.receiveButton}><Text style={styles.receiveText}>{loading ? 'Saving...' : 'Received'}</Text></Pressable></View>
        </ScrollView>
      </View>
    </View>
  </Modal>
}

export default function StaffOrders() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [branchName, setBranchName] = useState('Assigned Branch')
  const [branchId, setBranchId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [staffName, setStaffName] = useState('Staff name unavailable')
  const [branchStaff, setBranchStaff] = useState<string[]>([])
  const [customers, setCustomers] = useState<Record<string, User | null>>({})
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [reviewAmount, setReviewAmount] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [showLogout, setShowLogout] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const loadOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const profile = await getCurrentStaffProfile()
      const [branchOrders, branch, assignedStaff] = await Promise.all([getBranchOrders(profile.branchId), getBranchById(profile.branchId), getStaffByBranch(profile.branchId)])
      const customerEntries = await Promise.all(
        [...new Set(branchOrders.map((order) => order.customerId))].map(async (customerId) =>
          [customerId, await getUserById(customerId).catch(() => null)] as const
        )
      )
      setBranchId(profile.branchId)
      setStaffId(profile.staffId)
      setStaffName(profile.fullName?.trim() || 'Staff name unavailable')
      setBranchName(branch?.name?.trim() || 'Branch name unavailable')
      setBranchStaff(assignedStaff.filter((staff) => staff.isActive && staff.role === 'staff').map((staff) => staff.fullName?.trim() || 'Staff name unavailable'))
      setCustomers(Object.fromEntries(customerEntries))
      setOrders(branchOrders)
    } catch {
      setError('Could not load orders for your assigned branch. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadOrders() }, [])

  const visibleOrders = useMemo(() => orders.filter((order) => {
    const searchable = `${order.orderId} ${order.customerId} ${customers[order.customerId]?.fullName || ''} ${order.serviceType || ''}`.toLowerCase()
    return searchable.includes(search.trim().toLowerCase()) && (filter === 'all' || order.status === filter)
  }), [customers, filter, orders, search])

  const customer = selectedOrder ? customers[selectedOrder.customerId] || null : null

  const openReview = (order: Order) => {
    setSelectedOrder(order)
    setReviewAmount(String(order.confirmedPrice ?? order.estimatedPrice ?? ''))
    setReviewError('')
  }

  const closeReview = () => {
    if (!reviewLoading) {
      setSelectedOrder(null)
      setReviewError('')
    }
  }

  const receiveOrder = async () => {
    if (!selectedOrder || !branchId || !staffId) return
    const amount = Number(reviewAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setReviewError('Enter a valid final amount before receiving this order.')
      return
    }
    setReviewLoading(true)
    setReviewError('')
    try {
      if (await getPaymentByOrder(selectedOrder.orderId, branchId)) throw new Error('This order already has a payment record.')
      await updateVerifiedOrderDetails(selectedOrder.orderId, { confirmedPrice: amount })
      await updateBranchOrderStatus(selectedOrder.orderId, branchId, 'received')
      await createPayment({ orderId: selectedOrder.orderId, customerId: selectedOrder.customerId, staffId, branchId, amountCollected: amount })
      setOrders((items) => items.map((item) => item.orderId === selectedOrder.orderId ? { ...item, status: 'received', confirmedPrice: amount } : item))
      closeReview()
    } catch (receiveError) {
      setReviewError(receiveError instanceof Error ? receiveError.message : 'The order could not be received and recorded.')
    } finally {
      setReviewLoading(false)
    }
  }

  const changeStatus = async (order: Order, status: OrderStatus) => {
    if (!branchId) return
    setUpdatingId(order.orderId)
    setError('')
    try {
      await updateBranchOrderStatus(order.orderId, branchId, status)
      setOrders((items) => items.map((item) => item.orderId === order.orderId ? { ...item, status } : item))
    } catch {
      setError('This order could not be updated. It may belong to another branch or no longer allow this status change.')
    } finally {
      setUpdatingId(null)
    }
  }

  const cancelStaffOrder = async (order: Order) => {
    setUpdatingId(order.orderId)
    setError('')
    try {
      await cancelOrder(order.orderId, 'Cancelled by branch staff')
      setOrders((items) => items.map((item) => item.orderId === order.orderId ? { ...item, status: 'cancelled', cancelReason: 'Cancelled by branch staff' } : item))
    } catch {
      setError('This order could not be cancelled.')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try { await signOut(auth); router.replace('/staff/login') } finally { setLoggingOut(false); setShowLogout(false) }
  }

  return <View style={styles.screen}><LinearGradient colors={['#BEE9FF', '#F7FCFF', '#FFFFFF']} style={StyleSheet.absoluteFill} /><SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}><View style={styles.header}><Image source={require('../../assets/img/logo.png')} style={styles.logo} resizeMode="contain" /><View style={styles.heading}><Text style={styles.brand}>Branch Orders</Text><Text style={styles.role}>{branchName}</Text></View><Pressable onPress={() => void loadOrders()} accessibilityLabel="Refresh orders"><Ionicons name="refresh-outline" size={19} color="#0877C8" /></Pressable></View><Text style={styles.managers}>Managed by: {branchStaff.length ? branchStaff.join(', ') : 'No active branch staff assigned'}</Text><View style={styles.search}><Ionicons name="search-outline" size={16} color="#7590A1" /><TextInput value={search} onChangeText={setSearch} placeholder="Search order or customer" placeholderTextColor="#94A4AE" style={styles.searchInput} /></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>{(['all', 'pending_dropoff', 'received', 'washing', 'completed', 'cancelled'] as Filter[]).map((value) => <Pressable key={value} onPress={() => setFilter(value)} style={[styles.filterButton, filter === value && styles.filterActive]}><Text style={[styles.filterText, filter === value && styles.filterTextActive]}>{value === 'all' ? 'All' : labelFor(value)}</Text></Pressable>)}</ScrollView>{!!error && <Text style={styles.error}>{error}</Text>}{loading ? <Text style={styles.empty}>Loading branch orders...</Text> : visibleOrders.length === 0 ? <Text style={styles.empty}>No orders match this branch and filter.</Text> : visibleOrders.map((order) => { const action = nextAction(order.status); return <View key={order.orderId} style={styles.card}><View style={styles.icon}><Ionicons name="receipt" size={17} color="#0877C8" /></View><View style={styles.copy}><Text style={styles.id}>{order.orderId}</Text><Text style={styles.name}>{customers[order.customerId]?.fullName?.trim() || 'Customer name unavailable'}</Text><Text style={styles.meta}>{order.serviceType || 'Laundry service'} - {formatAmount(order.confirmedPrice ?? order.estimatedPrice)}</Text><View style={[styles.status, order.status === 'completed' ? styles.completed : order.status === 'cancelled' ? styles.cancelled : styles.processing]}><Text style={styles.statusText}>{labelFor(order.status)}</Text></View></View>{action && <Pressable disabled={updatingId === order.orderId} onPress={() => order.status === 'pending_dropoff' ? void openReview(order) : void changeStatus(order, action.next)} style={styles.action}><Text style={styles.actionText}>{action.label}</Text></Pressable>}{(order.status === 'pending_dropoff' || order.status === 'received') && <Pressable disabled={updatingId === order.orderId} onPress={() => void cancelStaffOrder(order)} style={styles.cancelAction}><Text style={styles.cancelActionText}>Cancel</Text></Pressable>}</View> })}</ScrollView><Nav active="orders" router={router} onLogout={() => setShowLogout(true)} /></SafeAreaView><OrderReviewModal visible={!!selectedOrder} order={selectedOrder} customer={customer} branchName={branchName} staffName={staffName} amount={reviewAmount} loading={reviewLoading} error={reviewError} onAmountChange={setReviewAmount} onCancel={closeReview} onReceive={() => void receiveOrder()} /><LogoutConfirmModal visible={showLogout} loading={loggingOut} onCancel={() => setShowLogout(false)} onConfirm={() => void handleLogout()} /></View>
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' }, safe: { flex: 1 }, content: { width: '100%', maxWidth: 420, alignSelf: 'center', padding: 11, paddingBottom: 18 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 }, heading: { flex: 1, marginLeft: 8 }, logo: { width: 44, height: 38 }, brand: { color: '#075191', fontSize: 15, fontWeight: '800' }, role: { color: '#6B879B', fontSize: 7, marginTop: 2 }, managers: { color: '#527B9A', fontSize: 8, marginBottom: 10 },
  search: { height: 34, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, borderRadius: 5, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D3E3EC' }, searchInput: { flex: 1, color: '#264C63', fontSize: 9 }, filterRow: { gap: 6, paddingVertical: 8 }, filterButton: { paddingHorizontal: 9, height: 27, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D3E3EC' }, filterActive: { backgroundColor: '#DDF1FF', borderColor: '#6DB7E8' }, filterText: { color: '#668395', fontSize: 8 }, filterTextActive: { color: '#0877C8', fontWeight: '800' },
  error: { color: '#AF3546', backgroundColor: '#FFF0F1', borderRadius: 6, padding: 9, fontSize: 9, marginBottom: 8 }, empty: { color: '#6B879B', fontSize: 9, textAlign: 'center', marginTop: 24 }, card: { minHeight: 92, flexDirection: 'row', alignItems: 'flex-start', padding: 8, marginTop: 8, borderRadius: 7, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D3E3EC' }, icon: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 5, backgroundColor: '#E1F3FF' }, copy: { flex: 1, marginLeft: 8 }, id: { color: '#075191', fontSize: 9, fontWeight: '800' }, name: { color: '#395E73', fontSize: 8, marginTop: 2 }, meta: { color: '#79909E', fontSize: 7, marginTop: 3 }, status: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 3, marginTop: 6, borderRadius: 6 }, processing: { backgroundColor: '#D7F0FF' }, completed: { backgroundColor: '#D7F4DF' }, cancelled: { backgroundColor: '#FFE1E4' }, statusText: { color: '#3F6A81', fontSize: 7, fontWeight: '800' }, action: { alignSelf: 'center', paddingHorizontal: 8, paddingVertical: 7, borderRadius: 6, backgroundColor: '#0877C8' }, actionText: { color: '#FFFFFF', fontSize: 7, fontWeight: '800' }, cancelAction: { position: 'absolute', right: 8, bottom: 7, paddingHorizontal: 6, paddingVertical: 3 }, cancelActionText: { color: '#AF3546', fontSize: 7, fontWeight: '800' },
  nav: { minHeight: 57, flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#B6DDEF' }, navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 }, navLabel: { color: '#71879A', fontSize: 7 }, active: { color: '#0877C8', fontWeight: '800' },
  modalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18, backgroundColor: 'rgba(6, 30, 50, 0.42)' }, modalCard: { width: '100%', maxWidth: 380, maxHeight: '88%', borderRadius: 17, backgroundColor: '#FFFFFF' }, modalContent: { padding: 22 }, modalIcon: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', borderRadius: 29, backgroundColor: '#E8F5FF' }, modalTitle: { marginTop: 11, color: '#073D91', fontSize: 20, fontWeight: '800', textAlign: 'center' }, modalSubtitle: { marginTop: 5, color: '#7187AD', fontSize: 11, textAlign: 'center' }, detailGroup: { marginTop: 14, paddingBottom: 9, borderBottomWidth: 1, borderBottomColor: '#E5EDF2' }, detailLabel: { color: '#7B93A0', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' }, detailValue: { marginTop: 4, color: '#264C63', fontSize: 12, fontWeight: '700' }, detailSecondary: { marginTop: 3, color: '#71879A', fontSize: 10 }, amountGroup: { marginTop: 14 }, amountInput: { height: 40, marginTop: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#B7D6E6', color: '#075191', fontSize: 15, fontWeight: '800' }, modalError: { marginTop: 10, padding: 8, borderRadius: 5, color: '#AF3546', backgroundColor: '#FFF0F1', fontSize: 10 }, modalActions: { flexDirection: 'row', gap: 12, marginTop: 18 }, modalCancel: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#B4C6D9' }, modalCancelText: { color: '#6E84A7', fontSize: 12, fontWeight: '700' }, receiveButton: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#0877C8' }, receiveText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
})
