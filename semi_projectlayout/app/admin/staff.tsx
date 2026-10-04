import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase/firebase'
import { LogoutConfirmModal } from '../../components/LogoutConfirmModal'
import { getBranches } from '../../database/services/branchService'
import { getAllStaff, updateStaffStatus } from '../../database/services/staffService'
import type { Branch } from '../../database/models/Branch'
import type { StaffAccount } from '../../database/models/StaffAccount'

type FilterMenu = 'branch' | 'status' | null

export default function AdminStaff() {
  const router = useRouter()
  const [staff, setStaff] = useState<StaffAccount[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [menu, setMenu] = useState<FilterMenu>(null)
  const [selected, setSelected] = useState<StaffAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [showLogout, setShowLogout] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [accounts, savedBranches] = await Promise.all([getAllStaff(), getBranches()])
      setStaff(accounts.filter((account) => account.role === 'staff'))
      setBranches(savedBranches)
    } catch {
      setError('Could not load staff accounts. Check your connection and try again.')
    } finally { setLoading(false) }
  }

  useEffect(() => { void loadData() }, [])

  const visibleStaff = useMemo(() => staff.filter((item) => {
    const branch = branches.find((entry) => entry.branchId === item.branchId)
    const branchName = branch?.name?.trim() || 'Branch name unavailable'
    const matchesSearch = `${item.fullName} ${item.email} ${branchName}`.toLowerCase().includes(search.trim().toLowerCase())
    return matchesSearch && (branchFilter === 'all' || item.branchId === branchFilter) && (statusFilter === 'all' || (statusFilter === 'active' ? item.isActive : !item.isActive))
  }), [branchFilter, branches, search, staff, statusFilter])

  const changeStatus = async (item: StaffAccount) => {
    setUpdatingId(item.staffId)
    setError('')
    try {
      await updateStaffStatus(item.staffId, !item.isActive)
      setStaff((items) => items.map((entry) => entry.staffId === item.staffId ? { ...entry, isActive: !entry.isActive } : entry))
      setSelected((current) => current?.staffId === item.staffId ? { ...current, isActive: !current.isActive } : current)
    } catch { setError('Could not update this account. Check your admin access and try again.') }
    finally { setUpdatingId(null) }
  }

  const branchName = (branchId: string) => branches.find((branch) => branch.branchId === branchId)?.name?.trim() || 'Branch name unavailable'
  const navigate = (screen: 'home' | 'staff' | 'payments') => router.replace(screen === 'home' ? '/admin/home' : screen === 'payments' ? '/admin/payment' : '/admin/staff')

  return <View style={styles.screen}>
    <LinearGradient colors={['#C5E9FC', '#F4FBFF', '#DFF4FF']} style={StyleSheet.absoluteFill} />
    <Image source={require('../../assets/img/bubble1.png')} style={styles.bubble} resizeMode="contain" />
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}><Pressable onPress={() => router.replace('/admin/home')} accessibilityLabel="Go to admin home"><Ionicons name="arrow-back" size={21} color="#0877C8" /></Pressable><View style={styles.heading}><Text style={styles.title}>Staff Management</Text><Text style={styles.subtitle}>View staff accounts and assigned branches</Text></View><Pressable onPress={() => void loadData()} accessibilityLabel="Refresh staff"><Ionicons name="refresh-outline" size={20} color="#0877C8" /></Pressable></View>
        <Pressable onPress={() => router.replace('/admin/createstaff')} style={styles.createButton}><Ionicons name="add" size={18} color="#FFFFFF" /><Text style={styles.createLabel}>Create Staff</Text></Pressable>
        <View style={styles.searchBox}><Ionicons name="search-outline" size={17} color="#7991A1" /><TextInput value={search} onChangeText={setSearch} placeholder="Search staff..." placeholderTextColor="#8DA0AD" style={styles.searchInput} /></View>
        <View style={styles.filters}><FilterButton label={branchFilter === 'all' ? 'All Branches' : branchName(branchFilter)} onPress={() => setMenu(menu === 'branch' ? null : 'branch')} /><FilterButton label={statusFilter === 'all' ? 'All Status' : statusFilter === 'active' ? 'Active' : 'Inactive'} onPress={() => setMenu(menu === 'status' ? null : 'status')} /></View>
        {menu === 'branch' && <View style={styles.menu}>{[['all', 'All Branches'], ...branches.map((branch) => [branch.branchId, branch.name?.trim() || 'Branch name unavailable'] as const)].map(([value, label]) => <Pressable key={value} onPress={() => { setBranchFilter(value); setMenu(null) }} style={styles.menuItem}><Text style={styles.menuText}>{label}</Text>{branchFilter === value && <Ionicons name="checkmark" size={16} color="#0877C8" />}</Pressable>)}</View>}
        {menu === 'status' && <View style={styles.menu}>{[['all', 'All Status'], ['active', 'Active'], ['inactive', 'Inactive']].map(([value, label]) => <Pressable key={value} onPress={() => { setStatusFilter(value as typeof statusFilter); setMenu(null) }} style={styles.menuItem}><Text style={styles.menuText}>{label}</Text>{statusFilter === value && <Ionicons name="checkmark" size={16} color="#0877C8" />}</Pressable>)}</View>}
        {!!error && <Text style={styles.error}>{error}</Text>}
        {loading ? <Text style={styles.empty}>Loading staff accounts...</Text> : visibleStaff.length === 0 ? <Text style={styles.empty}>No staff accounts match these filters.</Text> : visibleStaff.map((item) => <View key={item.staffId} style={styles.staffCard}><View style={[styles.avatar, { backgroundColor: item.isActive ? '#2DAE68' : '#8A9CAF' }]}><Ionicons name="person" size={22} color="#FFFFFF" /></View><View style={styles.staffCopy}><Text style={styles.staffName}>{item.fullName?.trim() || 'Staff name unavailable'}</Text><Text style={styles.email}>{item.email}</Text><Text style={styles.branch}><Ionicons name="location-outline" size={11} color="#7890A0" /> {branchName(item.branchId)}</Text><View style={styles.statusRow}><View style={[styles.dot, { backgroundColor: item.isActive ? '#21A85D' : '#EA4E4E' }]} /><Text style={[styles.status, { color: item.isActive ? '#15914D' : '#DF4444' }]}>{item.isActive ? 'Active' : 'Inactive'}</Text></View></View><View style={styles.cardActions}><Pressable onPress={() => setSelected(item)} style={styles.viewButton}><Ionicons name="eye-outline" size={13} color="#0877C8" /><Text style={styles.viewText}>View</Text></Pressable><Pressable disabled={updatingId === item.staffId} onPress={() => void changeStatus(item)} style={[styles.toggleButton, item.isActive ? styles.deactivate : styles.activate]}><Ionicons name={item.isActive ? 'close-outline' : 'checkmark-outline'} size={13} color={item.isActive ? '#E04444' : '#15914D'} /><Text style={[styles.toggleText, { color: item.isActive ? '#E04444' : '#15914D' }]}>{updatingId === item.staffId ? 'Saving...' : item.isActive ? 'Deactivate' : 'Activate'}</Text></Pressable></View></View>)}
      </ScrollView>
      <AdminNav active="staff" onNavigate={navigate} onLogout={() => setShowLogout(true)} />
    </SafeAreaView>
    <Modal visible={selected !== null} transparent animationType="fade" onRequestClose={() => setSelected(null)}><View style={styles.modalBackdrop}><View style={styles.detailModal}>{selected && <><Text style={styles.modalTitle}>{selected.fullName?.trim() || 'Staff name unavailable'}</Text><Text style={styles.modalLine}>{selected.email}</Text><Text style={styles.modalLine}>Branch: {branchName(selected.branchId)}</Text><Text style={styles.modalLine}>Status: {selected.isActive ? 'Active' : 'Inactive'}</Text><Pressable onPress={() => setSelected(null)} style={styles.closeButton}><Text style={styles.closeText}>Close</Text></Pressable></>}</View></View></Modal>
    <LogoutConfirmModal visible={showLogout} loading={loggingOut} onCancel={() => setShowLogout(false)} onConfirm={async () => { setLoggingOut(true); try { await signOut(auth); router.replace('/admin') } finally { setLoggingOut(false); setShowLogout(false) } }} />
  </View>
}

function FilterButton({ label, onPress }: { label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={styles.filter}><Text style={styles.filterText} numberOfLines={1}>{label}</Text><Ionicons name="chevron-down" size={13} color="#587487" /></Pressable> }
function AdminNav({ active, onNavigate, onLogout }: { active: string; onNavigate: (screen: 'home' | 'staff' | 'payments') => void; onLogout: () => void }) { return <View style={styles.bottomNav}>{[['home', 'home', 'Home'], ['staff', 'people', 'Staff'], ['payments', 'card', 'Payments']].map(([key, icon, label]) => <Pressable key={key} onPress={() => onNavigate(key as 'home' | 'staff' | 'payments')} style={styles.navItem}><Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={21} color={active === key ? '#0877C8' : '#71879A'} /><Text style={[styles.navLabel, active === key && styles.activeNavLabel]}>{label}</Text></Pressable>)}<Pressable onPress={onLogout} style={styles.navItem}><Ionicons name="log-out-outline" size={21} color="#71879A" /><Text style={styles.navLabel}>Log Out</Text></Pressable></View> }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#E3F4FF' }, safeArea: { flex: 1 }, content: { width: '100%', maxWidth: 420, alignSelf: 'center', padding: 10, paddingBottom: 18 }, bubble: { position: 'absolute', width: 105, height: 105, top: -30, right: -25, opacity: 0.35 }, topBar: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10 }, heading: { flex: 1 }, title: { color: '#075191', fontSize: 15, fontWeight: '800' }, subtitle: { color: '#668395', fontSize: 8, marginTop: 2 }, createButton: { height: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 6, backgroundColor: '#0877D1', marginTop: 7 }, createLabel: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' }, searchBox: { height: 31, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, marginTop: 10, borderRadius: 6, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D2E0E8' }, searchInput: { flex: 1, color: '#234B63', fontSize: 9, paddingVertical: 0 }, filters: { flexDirection: 'row', gap: 8, marginTop: 6 }, filter: { flex: 1, height: 27, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, borderRadius: 5, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D2E0E8' }, filterText: { color: '#597587', fontSize: 8, flex: 1 }, menu: { marginTop: 4, borderRadius: 6, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D2E0E8', overflow: 'hidden' }, menuItem: { minHeight: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#EDF3F7' }, menuText: { color: '#315B73', fontSize: 9 }, error: { color: '#B2394B', backgroundColor: '#FFF0F2', padding: 9, borderRadius: 6, fontSize: 9, marginTop: 8 }, empty: { color: '#668395', fontSize: 10, textAlign: 'center', marginTop: 30 }, staffCard: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 105, padding: 8, marginTop: 7, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.96)', borderWidth: 1, borderColor: '#76C0F2', borderStyle: 'dashed' }, avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, staffCopy: { flex: 1, marginLeft: 8 }, staffName: { color: '#075191', fontSize: 10, fontWeight: '800' }, email: { color: '#647F90', fontSize: 7, marginTop: 2 }, branch: { color: '#647F90', fontSize: 7, marginTop: 5 }, statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 7 }, dot: { width: 6, height: 6, borderRadius: 3 }, status: { fontSize: 7, fontWeight: '700' }, cardActions: { position: 'absolute', right: 8, bottom: 8, flexDirection: 'row', gap: 5 }, viewButton: { height: 23, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, borderRadius: 5, backgroundColor: '#E4F4FF' }, viewText: { color: '#0877C8', fontSize: 7, fontWeight: '700' }, toggleButton: { height: 23, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, borderRadius: 5 }, deactivate: { backgroundColor: '#FFF0F0' }, activate: { backgroundColor: '#E9FAEF' }, toggleText: { fontSize: 7, fontWeight: '700' }, modalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22, backgroundColor: 'rgba(17,50,70,0.42)' }, detailModal: { width: '100%', maxWidth: 360, padding: 20, borderRadius: 10, backgroundColor: '#FFFFFF' }, modalTitle: { color: '#075191', fontSize: 17, fontWeight: '800', marginBottom: 12 }, modalLine: { color: '#557386', fontSize: 11, marginTop: 7 }, closeButton: { alignItems: 'center', justifyContent: 'center', height: 36, marginTop: 18, borderRadius: 6, backgroundColor: '#0877D1' }, closeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' }, bottomNav: { minHeight: 59, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#A9D8F2', backgroundColor: 'rgba(255,255,255,0.96)' }, navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 }, navLabel: { color: '#71879A', fontSize: 8 }, activeNavLabel: { color: '#0877C8', fontWeight: '800' },
})
