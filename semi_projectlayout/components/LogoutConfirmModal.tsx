import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'

type LogoutConfirmModalProps = {
  visible: boolean
  onCancel: () => void
  onConfirm: () => void
  loading?: boolean
}

export function LogoutConfirmModal({ visible, onCancel, onConfirm, loading = false }: LogoutConfirmModalProps) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}><Ionicons name="log-out-outline" size={31} color="#F04451" /></View>
          <Text style={styles.title}>Log Out?</Text>
          <Text style={styles.message}>Are you sure you want to log out{`\n`}of your account?</Text>
          <View style={styles.actions}>
            <Pressable disabled={loading} onPress={onCancel} style={({ pressed }) => [styles.button, styles.cancelButton, pressed && styles.pressed]}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable disabled={loading} onPress={onConfirm} style={({ pressed }) => [styles.button, styles.logoutButton, pressed && styles.pressed]}>
              <Text style={styles.logoutText}>{loading ? 'Logging out...' : 'Logout'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(6, 30, 50, 0.42)' },
  card: { width: '100%', maxWidth: 355, alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 22, borderRadius: 17, backgroundColor: '#FFFFFF' },
  iconCircle: { width: 66, height: 66, alignItems: 'center', justifyContent: 'center', borderRadius: 33, backgroundColor: '#FFF0F1' },
  title: { marginTop: 12, color: '#073D91', fontSize: 22, fontWeight: '800' },
  message: { marginTop: 7, color: '#7187AD', fontSize: 13, lineHeight: 17, textAlign: 'center' },
  actions: { width: '100%', flexDirection: 'row', gap: 20, marginTop: 18 },
  button: { flex: 1, height: 51, alignItems: 'center', justifyContent: 'center', borderRadius: 9, borderWidth: 1 },
  cancelButton: { borderColor: '#B4C6D9', backgroundColor: '#FFFFFF' },
  logoutButton: { borderColor: '#E8424E', backgroundColor: '#F04451' },
  cancelText: { color: '#6E84A7', fontSize: 15, fontWeight: '700' },
  logoutText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.72 },
})