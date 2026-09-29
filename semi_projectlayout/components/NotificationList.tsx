import { Ionicons } from '@expo/vector-icons'
import { useRouter, useFocusEffect } from 'expo-router'
import React, { useCallback, useState } from 'react'
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { auth } from '../firebase/firebase'
import { getAdminNotifications, getStaffNotifications, getUserNotifications, markNotificationAsRead } from '../database/services/notificationService'
import { getCurrentStaffProfile } from '../database/services/staffAuthenticationService'
import type { Notification, NotificationRecipientRole } from '../database/models/Notification'

const formatDate = (notification: Notification) => notification.createdAt?.toDate ? notification.createdAt.toDate().toLocaleString() : 'Date unavailable'

export function NotificationList({ role, title }: { role: NotificationRecipientRole; title: string }) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadNotifications = async () => {
    if (!auth.currentUser) { setError('Please sign in again.'); setLoading(false); return }
    setLoading(true)
    setError('')
    try {
      setNotifications(role === 'admin'
        ? await getAdminNotifications()
        : role === 'staff'
        ? await (async () => { const profile = await getCurrentStaffProfile(); return getStaffNotifications(profile.staffId, profile.branchId) })()
        : await getUserNotifications(auth.currentUser.uid))
   } catch (err: unknown) {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String(err.code)
      : 'unknown';

  const message = err instanceof Error
    ? err.message
    : String(err);

  console.error('Notification loading failed:', err);
  setError(`${code}: ${message}`);
} finally {
  setLoading(false);
}
  }

  useFocusEffect(useCallback(() => { void loadNotifications() }, []))

  const openNotification = async (notification: Notification) => {
    setNotifications((items) => items.map((item) => item.notificationId === notification.notificationId ? { ...item, isRead: true } : item))
    try { if (!notification.isRead) await markNotificationAsRead(notification.notificationId) } catch { /* The local state can still show the selected notification as read. */ }
    if (notification.target === 'payment' && role !== 'customer') router.replace(role === 'admin' ? '/admin/payment' : '/staff/payment')
    else if (notification.target === 'management') router.replace('/admin/staff')
    else router.replace(role === 'customer' ? '/insideapp/order' : '/staff/orders')
  }

  return <View style={styles.screen}><LinearGradient colors={['#BFE6FB', '#DFF3FD', '#FFFFFF']} style={StyleSheet.absoluteFill} /><Image source={require('../assets/img/bubble1.png')} resizeMode="contain" style={{ position: 'absolute', width: 70, height: 70, top: 25, left: -22, opacity: 0.45 }} /><Image source={require('../assets/img/bubble2.png')} resizeMode="contain" style={{ position: 'absolute', width: 105, height: 105, top: 120, right: -38, opacity: 0.38 }} /><View style={styles.header}><Pressable onPress={() => router.back()} accessibilityLabel="Go back"><Ionicons name="arrow-back" size={21} color="#2563EB" /></Pressable><Text style={styles.title}>{title}</Text><Pressable onPress={() => void loadNotifications()} accessibilityLabel="Refresh notifications"><Ionicons name="refresh-outline" size={19} color="#2563EB" /></Pressable></View>{loading ? <ActivityIndicator size="small" color="#2563EB" style={styles.loading} /> : <ScrollView contentContainerStyle={styles.list}>{!!error && <Text style={styles.error}>{error}</Text>}{!error && notifications.length === 0 ? <View style={styles.empty}><Ionicons name="notifications-off-outline" size={35} color="#8B9AA7" /><Text style={styles.emptyTitle}>No notifications</Text><Text style={styles.emptyText}>You are all caught up.</Text></View> : notifications.map((notification) => <Pressable key={notification.notificationId} onPress={() => void openNotification(notification)} style={[styles.card, !notification.isRead && styles.unread, { borderRadius: 12, padding: 12, marginBottom: 10 }]}><View style={[styles.icon, !notification.isRead && styles.unreadIcon]}><Ionicons name={notification.type === 'payment_verified' ? 'card-outline' : notification.type === 'new_order' ? 'receipt-outline' : 'notifications-outline'} size={18} color="#2563EB" /></View><View style={styles.copy}><Text style={styles.message}>{notification.message}</Text><Text style={styles.date}>{formatDate(notification)}</Text>{notification.orderId ? <Text style={styles.reference}>Order: {notification.orderId}</Text> : null}</View>{!notification.isRead ? <View style={styles.unreadDot} /> : null}</Pressable>)}</ScrollView>}</View>
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#F4FBFF' }, header: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#D3E3EC', backgroundColor: '#FFFFFF' }, title: { color: '#075191', fontSize: 16, fontWeight: '800' }, loading: { marginTop: 28 }, list: { padding: 12, paddingBottom: 24 }, error: { padding: 9, borderRadius: 6, color: '#AF3546', backgroundColor: '#FFF0F1', fontSize: 10 }, empty: { alignItems: 'center', marginTop: 80 }, emptyTitle: { marginTop: 10, color: '#587487', fontSize: 14, fontWeight: '800' }, emptyText: { marginTop: 4, color: '#8B9AA7', fontSize: 10 }, card: { minHeight: 72, flexDirection: 'row', alignItems: 'center', padding: 10, marginBottom: 8, borderRadius: 8, borderWidth: 1, borderColor: '#D3E3EC', backgroundColor: '#FFFFFF' }, unread: { borderColor: '#8CC9F0', backgroundColor: '#F1FAFF' }, icon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#E8F5FF' }, unreadIcon: { backgroundColor: '#D4EDFF' }, copy: { flex: 1, marginLeft: 9 }, message: { color: '#264C63', fontSize: 10, lineHeight: 14, fontWeight: '700' }, date: { marginTop: 4, color: '#7B93A0', fontSize: 8 }, reference: { marginTop: 3, color: '#0877C8', fontSize: 8 }, unreadDot: { width: 8, height: 8, marginLeft: 6, borderRadius: 4, backgroundColor: '#E8424E' } })
