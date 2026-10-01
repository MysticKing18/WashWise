import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase/firebase'
import { LogoutConfirmModal } from '../../components/LogoutConfirmModal'
import { getBranchById } from '../../database/services/branchService'
import { getCurrentStaffProfile } from '../../database/services/staffAuthenticationService'
import { getPaymentsByBranch } from '../../database/services/paymentService'
import type { Payment } from '../../database/models/Payment'

function Nav({ active, router, onLogout }: { active: string; router: ReturnType<typeof useRouter>; onLogout: () => void }) {
  return <View style={styles.nav}>{[['home', 'home', 'Home'], ['orders', 'receipt', 'Orders'], ['payment', 'card', 'Records']].map(([key, icon, label]) => <Pressable key={key} onPress={() => router.replace(`/staff/${key}`)} style={styles.navItem}><Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={active === key ? '#0877C8' : '#71879A'} /><Text style={[styles.navLabel, active === key && styles.active]}>{label}</Text></Pressable>)}<Pressable onPress={onLogout} style={styles.navItem}><Ionicons name="log-out-outline" size={20} color="#71879A" /><Text style={styles.navLabel}>Log Out</Text></Pressable></View>
}

const formatDate = (payment: Payment) => payment.verifiedAt.toDate().toLocaleString()

function PaymentDetailModal({ payment, branchName, onClose }: { payment: Payment | null; branchName: string; onClose: () => void }) {
  return <Modal transparent visible={!!payment} animationType="fade" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalCard}>
        {payment && <>
          <Pressable onPress={onClose} accessibilityLabel="Close payment details" style={styles.closeIcon}><Ionicons name="close" size={22} color="#587487" /></Pressable>
          <View style={styles.modalIcon}><Ionicons name="card-outline" size={28} color="#0877C8" /></View>
          <Text style={styles.modalTitle}>Payment Details</Text>
          <Text style={styles.modalSubtitle}>Verified transaction record</Text>
          <View style={styles.detailGroup}><Text style={styles.detailLabel}>Order ID</Text><Text style={styles.detailValue}>{payment.orderId}</Text></View>
          <View style={styles.detailGroup}><Text style={styles.detailLabel}>Customer</Text><Text style={styles.detailValue}>{payment.customerId}</Text></View>
          <View style={styles.detailGroup}><Text style={styles.detailLabel}>Assigned branch</Text><Text style={styles.detailValue}>{branchName}</Text></View>
          <View style={styles.detailGroup}><Text style={styles.detailLabel}>Amount collected</Text><Text style={styles.detailValue}>P{payment.amountCollected.toFixed(2)}</Text></View>
          <View style={styles.detailGroup}><Text style={styles.detailLabel}>Collected by</Text><Text style={styles.detailValue}>{payment.staffId}</Text></View>
          <View style={styles.detailGroup}><Text style={styles.detailLabel}>Verified at</Text><Text style={styles.detailValue}>{formatDate(payment)}</Text></View>
          <View style={styles.modalStatus}><Ionicons name="checkmark-circle" size={14} color="#15914D" /><Text style={styles.modalStatusText}>Verified</Text></View>
          <Pressable onPress={onClose} style={styles.closeButton}><Text style={styles.closeButtonText}>Close</Text></Pressable>
        </>}
      </View>
    </View>
  </Modal>
}

export default function StaffPayment() {
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [branchName, setBranchName] = useState('Assigned Branch')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showLogout, setShowLogout] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const loadPayments = async () => {
    setLoading(true)
    setError('')
    try {
      const profile = await getCurrentStaffProfile()
      const [branch, branchPayments] = await Promise.all([getBranchById(profile.branchId), getPaymentsByBranch(profile.branchId)])
      setBranchName(branch?.name || profile.branchId)
      setPayments(branchPayments.sort((left, right) => right.verifiedAt.toMillis() - left.verifiedAt.toMillis()))
    } catch {
      setError('Could not load payment records. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadPayments() }, [])

  const handleLogout = async () => { setLoggingOut(true); try { await signOut(auth); router.replace('/staff/login') } finally { setLoggingOut(false); setShowLogout(false) } }

  return <View style={styles.screen}><LinearGradient colors={['#BEE9FF', '#F7FCFF', '#FFFFFF']} style={StyleSheet.absoluteFill} /><SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}><View style={styles.header}><Image source={require('../../assets/img/logo.png')} style={styles.logo} resizeMode="contain" /><View style={styles.heading}><Text style={styles.brand}>Payment Records</Text><Text style={styles.role}>{branchName}</Text></View><Pressable onPress={() => void loadPayments()} accessibilityLabel="Refresh payment records"><Ionicons name="refresh-outline" size={19} color="#0877C8" /></Pressable></View><View style={styles.filter}><Text style={styles.filterText}>Verified payments</Text><Ionicons name="checkmark-circle" size={14} color="#15914D" /></View>{!!error && <Text style={styles.error}>{error}</Text>}{loading ? <Text style={styles.empty}>Loading payment records...</Text> : payments.length === 0 ? <Text style={styles.empty}>No verified payments for this branch.</Text> : payments.map((payment) => <View key={payment.paymentId} style={styles.card}><View style={styles.top}><View style={styles.icon}><Ionicons name="card" size={17} color="#0877C8" /></View><Text style={styles.id}>{payment.orderId}</Text><Text style={styles.amount}>P{payment.amountCollected.toFixed(2)}</Text></View><Text style={styles.name}>Customer: {payment.customerId}</Text><Text style={styles.meta}>Collected by: {payment.staffId}</Text><Text style={styles.date}>{formatDate(payment)}</Text><View style={styles.cardFooter}><View style={styles.verified}><Ionicons name="checkmark-circle" size={11} color="#15914D" /><Text style={styles.verifiedText}>Verified</Text></View><Pressable onPress={() => setSelectedPayment(payment)} accessibilityLabel={`View payment ${payment.orderId}`} style={styles.viewButton}><Ionicons name="eye-outline" size={12} color="#0877C8" /><Text style={styles.viewButtonText}>View</Text></Pressable></View></View>)}</ScrollView><Nav active="payment" router={router} onLogout={() => setShowLogout(true)} /></SafeAreaView><PaymentDetailModal payment={selectedPayment} branchName={branchName} onClose={() => setSelectedPayment(null)} /><LogoutConfirmModal visible={showLogout} loading={loggingOut} onCancel={() => setShowLogout(false)} onConfirm={() => void handleLogout()} /></View>
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#FFFFFF' }, safe: { flex: 1 }, content: { width: '100%', maxWidth: 420, alignSelf: 'center', padding: 11, paddingBottom: 18 }, header: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 }, heading: { flex: 1 }, logo: { width: 44, height: 38 }, brand: { color: '#075191', fontSize: 15, fontWeight: '800' }, role: { color: '#6B879B', fontSize: 7, marginTop: 2 }, filter: { height: 31, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 9, borderRadius: 5, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D3E3EC' }, filterText: { color: '#668395', fontSize: 8 }, error: { color: '#AF3546', backgroundColor: '#FFF0F1', borderRadius: 6, padding: 9, fontSize: 9, marginTop: 9 }, empty: { color: '#6B879B', fontSize: 9, textAlign: 'center', marginTop: 24 }, card: { minHeight: 106, padding: 9, marginTop: 9, borderRadius: 7, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D3E3EC' }, top: { flexDirection: 'row', alignItems: 'center' }, icon: { width: 29, height: 29, alignItems: 'center', justifyContent: 'center', borderRadius: 5, backgroundColor: '#E1F3FF' }, id: { marginLeft: 7, color: '#075191', fontSize: 9, fontWeight: '800' }, amount: { marginLeft: 'auto', color: '#075191', fontSize: 10, fontWeight: '800' }, name: { color: '#45697C', fontSize: 8, marginTop: 8 }, meta: { color: '#79909E', fontSize: 7, marginTop: 4 }, date: { color: '#79909E', fontSize: 7, marginTop: 4 }, cardFooter: { minHeight: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 }, verified: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5, backgroundColor: '#D5F3E1' }, verifiedText: { color: '#15914D', fontSize: 6, fontWeight: '800' }, viewButton: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 5, borderWidth: 1, borderColor: '#A8D0E8' }, viewButtonText: { color: '#0877C8', fontSize: 7, fontWeight: '800' }, nav: { minHeight: 57, flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#B6DDEF' }, navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 }, navLabel: { color: '#71879A', fontSize: 7 }, active: { color: '#0877C8', fontWeight: '800' }, modalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18, backgroundColor: 'rgba(6, 30, 50, 0.42)' }, modalCard: { width: '100%', maxWidth: 360, maxHeight: '88%', padding: 20, borderRadius: 17, backgroundColor: '#FFFFFF' }, closeIcon: { position: 'absolute', top: 10, right: 10, zIndex: 1, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }, modalIcon: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', borderRadius: 29, backgroundColor: '#E8F5FF' }, modalTitle: { marginTop: 11, color: '#073D91', fontSize: 20, fontWeight: '800', textAlign: 'center' }, modalSubtitle: { marginTop: 5, color: '#7187AD', fontSize: 11, textAlign: 'center' }, detailGroup: { marginTop: 13, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E5EDF2' }, detailLabel: { color: '#7B93A0', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' }, detailValue: { marginTop: 4, color: '#264C63', fontSize: 11, fontWeight: '700' }, modalStatus: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 4, marginTop: 14, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#D5F3E1' }, modalStatusText: { color: '#15914D', fontSize: 8, fontWeight: '800' }, closeButton: { height: 42, alignItems: 'center', justifyContent: 'center', marginTop: 16, borderRadius: 8, backgroundColor: '#0877C8' }, closeButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' } })
