import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase/firebase'
import { LogoutConfirmModal } from '../../components/LogoutConfirmModal'

type ActionCardProps = {
	icon: keyof typeof Ionicons.glyphMap
	label: string
	detail: string
	onPress: () => void
}

function ActionCard({ icon, label, detail, onPress }: ActionCardProps) {
	return (
		<Pressable onPress={onPress} style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}>
			<View style={styles.actionIcon}><Ionicons name={icon} size={18} color="#0D72C9" /></View>
			<View style={styles.actionCopy}><Text style={styles.actionLabel}>{label}</Text><Text style={styles.actionDetail}>{detail}</Text></View>
			<Ionicons name="arrow-forward" size={17} color="#0D72C9" />
		</Pressable>
	)
}

function AdminNav({ active, onNavigate, onLogout }: { active: 'home' | 'staff' | 'payments'; onNavigate: (screen: 'home' | 'staff' | 'payments') => void; onLogout: () => void }) {
	const items: Array<{ key: 'home' | 'staff' | 'payments'; icon: keyof typeof Ionicons.glyphMap; label: string }> = [
		{ key: 'home', icon: 'home', label: 'Home' },
		{ key: 'staff', icon: 'people', label: 'Staff' },
		{ key: 'payments', icon: 'card', label: 'Payments' },
	]

	return <View style={styles.bottomNav}>{items.map((item) => <Pressable key={item.key} onPress={() => onNavigate(item.key)} style={styles.navItem} accessibilityRole="button" accessibilityLabel={item.label}>
		<Ionicons name={item.icon} size={21} color={active === item.key ? '#0877C8' : '#71879A'} />
		<Text style={[styles.navLabel, active === item.key && styles.activeNavLabel]}>{item.label}</Text>
	</Pressable>)}<Pressable onPress={onLogout} style={styles.navItem} accessibilityRole="button" accessibilityLabel="Log out"><Ionicons name="log-out-outline" size={21} color="#71879A" /><Text style={styles.navLabel}>Log Out</Text></Pressable></View>
}

export default function AdminHome() {
	const router = useRouter()
	const [showLogout, setShowLogout] = React.useState(false)
	const [loggingOut, setLoggingOut] = React.useState(false)
	const navigate = (screen: 'home' | 'staff' | 'payments') => {
		if (screen === 'staff') router.replace('/admin/staff')
		else if (screen === 'payments') router.replace('/admin/payment')
		else router.replace('/admin/home')
	}

	return <View style={styles.screen}>
		<LinearGradient colors={['#C5E9FC', '#F4FBFF', '#DFF4FF']} style={StyleSheet.absoluteFill} />
		<Image source={require('../../assets/img/bubble1.png')} style={[styles.bubble, styles.topBubble]} resizeMode="contain" />
		<Image source={require('../../assets/img/bubble2.png')} style={[styles.bubble, styles.rightBubble]} resizeMode="contain" />
		<SafeAreaView style={styles.safeArea}>
			<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				<View style={styles.brandRow}><View style={styles.brandMark}><Ionicons name="water" size={23} color="#FFFFFF" /></View><View><Text style={styles.brandName}>WashWise</Text><Text style={styles.brandSub}>Admin Panel</Text></View><Ionicons name="notifications-outline" size={23} color="#176A9E" style={styles.notification} /></View>
				<Text style={styles.greeting}>Hello, Admin!</Text><Text style={styles.caption}>See the progress today.</Text>
				<View style={styles.statsGrid}>
					<View style={[styles.statCard, styles.yellow]}><Ionicons name="people" size={20} color="#1F61B6" /><Text style={styles.statValue}>28</Text><Text style={styles.statLabel}>Total Staff</Text></View>
					<View style={[styles.statCard, styles.cream]}><Ionicons name="git-network" size={20} color="#C77D21" /><Text style={styles.statValue}>2</Text><Text style={styles.statLabel}>Branches</Text></View>
					<View style={[styles.statCard, styles.green]}><Ionicons name="person" size={20} color="#249443" /><Text style={styles.statValue}>28</Text><Text style={styles.statLabel}>Active Staff</Text></View>
					<View style={[styles.statCard, styles.purple]}><Ionicons name="card" size={20} color="#6133C7" /><Text style={styles.statValue}>8</Text><Text style={styles.statLabel}>Payments</Text></View>
				</View>
				<Text style={styles.sectionTitle}>Quick Action</Text>
				<ActionCard icon="person-add" label="Create Staff Account" detail="Add a new staff" onPress={() => router.replace('/admin/createstaff')} />
				<ActionCard icon="card" label="Payment History" detail="View recent transactions" onPress={() => navigate('payments')} />
				<ActionCard icon="git-network" label="Manage Branches" detail="View branches and assigned staff" onPress={() => navigate('staff')} />
			</ScrollView>
			<AdminNav active="home" onNavigate={navigate} onLogout={() => setShowLogout(true)} />
		</SafeAreaView>
		<LogoutConfirmModal visible={showLogout} loading={loggingOut} onCancel={() => setShowLogout(false)} onConfirm={async () => { setLoggingOut(true); try { await signOut(auth); router.replace('/admin') } finally { setLoggingOut(false); setShowLogout(false) } }} />
	</View>
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: '#E3F4FF' }, safeArea: { flex: 1 }, content: { width: '100%', maxWidth: 420, alignSelf: 'center', padding: 14, paddingBottom: 20 },
	bubble: { position: 'absolute', opacity: 0.35 }, topBubble: { width: 110, height: 110, top: -42, left: -42 }, rightBubble: { width: 125, height: 125, top: 210, right: -55 },
	brandRow: { flexDirection: 'row', alignItems: 'center' }, brandMark: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0877C8', marginRight: 8 }, brandName: { color: '#075191', fontSize: 18, fontWeight: '800' }, brandSub: { color: '#6B879B', fontSize: 8, marginTop: 1 }, notification: { marginLeft: 'auto' },
	greeting: { marginTop: 21, color: '#075191', fontSize: 21, fontWeight: '800' }, caption: { color: '#6C8495', fontSize: 9, marginTop: 2 }, statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }, statCard: { width: '48%', minHeight: 77, borderRadius: 9, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' }, yellow: { backgroundColor: '#FFF0B8' }, cream: { backgroundColor: '#FFEBC4' }, green: { backgroundColor: '#C8F6D5' }, purple: { backgroundColor: '#DCD2FF' }, statValue: { color: '#28516E', fontSize: 21, fontWeight: '800', marginTop: 2 }, statLabel: { color: '#648093', fontSize: 8 },
	sectionTitle: { color: '#075191', fontSize: 12, fontWeight: '800', marginTop: 20, marginBottom: 7 }, actionCard: { minHeight: 54, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, marginBottom: 7, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 1, borderColor: '#CFE1EC' }, actionIcon: { width: 31, height: 31, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#D9F0FF' }, actionCopy: { flex: 1, marginLeft: 9 }, actionLabel: { color: '#075191', fontSize: 10, fontWeight: '800' }, actionDetail: { color: '#6B879B', fontSize: 8, marginTop: 2 }, pressed: { opacity: 0.7 }, bottomNav: { minHeight: 59, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#A9D8F2', backgroundColor: 'rgba(255,255,255,0.96)' }, navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 }, navLabel: { color: '#71879A', fontSize: 8 }, activeNavLabel: { color: '#0877C8', fontWeight: '800' },
})
