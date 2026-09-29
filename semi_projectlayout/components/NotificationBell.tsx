import { Ionicons } from '@expo/vector-icons'
import { useRouter, useFocusEffect } from 'expo-router'
import React, { useCallback, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { auth } from '../firebase/firebase'
import { getAdminUnreadNotificationCount, getStaffUnreadNotificationCount, getUnreadNotificationCount } from '../database/services/notificationService'
import { getCurrentStaffProfile } from '../database/services/staffAuthenticationService'
import type { NotificationRecipientRole } from '../database/models/Notification'

export function NotificationBell({ role, color = '#176A9E' }: { role: NotificationRecipientRole; color?: string }) {
  const router = useRouter()
  const [count, setCount] = useState(0)

  useFocusEffect(useCallback(() => {
    let mounted = true
    const loadCount = async () => {
      if (!auth.currentUser) return
      try {
        const unreadCount = role === 'admin'
          ? await getAdminUnreadNotificationCount()
          : role === 'staff'
          ? await (async () => { const profile = await getCurrentStaffProfile(); return getStaffUnreadNotificationCount(profile.staffId, profile.branchId) })()
          : await getUnreadNotificationCount(auth.currentUser.uid)
        if (mounted) setCount(unreadCount)
      } catch {
        if (mounted) setCount(0)
      }
    }
    void loadCount()
    return () => { mounted = false }
  }, []))

  return <Pressable accessibilityRole="button" accessibilityLabel={`Notifications${count ? `, ${count} unread` : ''}`} onPress={() => router.push(role === 'customer' ? '/insideapp/notifications' : role === 'staff' ? '/staff/notifications' : '/admin/notifications')} style={styles.button}><Ionicons name="notifications-outline" size={21} color={color} />{count > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text></View> : null}</Pressable>
}

const styles = StyleSheet.create({ button: { position: 'relative', width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }, badge: { position: 'absolute', top: -2, right: -3, minWidth: 15, height: 15, paddingHorizontal: 3, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#E8424E', borderWidth: 1, borderColor: '#FFFFFF' }, badgeText: { color: '#FFFFFF', fontSize: 8, fontWeight: '800' } })
