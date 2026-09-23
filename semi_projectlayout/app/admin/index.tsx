import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image, Alert } from 'react-native'
import React, { useState } from 'react'
import { useRouter } from 'expo-router'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase/firebase'

const ADMIN_EMAIL = 'kinglukecroewyn@gmail.com'

const login = () => {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    if (!password) {
      Alert.alert('Missing password', 'Enter your admin password to continue.')
      return
    }

    setIsLoading(true)
    try {
      const credential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password)
      const staffSnapshot = await getDoc(doc(db, 'staffAccounts', credential.user.uid))
      const staff = staffSnapshot.data() as { role?: string; isActive?: boolean } | undefined

      if (!staffSnapshot.exists() || staff?.role !== 'admin' || staff.isActive !== true) {
        await signOut(auth)
        Alert.alert('Access denied', 'This account is not configured as an active admin.')
        return
      }

      router.replace('/admin/home')
    } catch (error: any) {
      const message = error?.code === 'auth/invalid-credential'
        ? 'The admin password is incorrect.'
        : error?.code === 'auth/too-many-requests'
          ? 'Too many attempts. Try again later.'
          : 'Unable to log in. Check your connection and Firebase setup.'
      Alert.alert('Admin login failed', message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/img/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.subtitle}>Enter admin password to continue</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter admin password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoFocus
            />
          </View>

          <TouchableOpacity disabled={isLoading} style={[styles.primaryButton, isLoading && styles.disabledButton]} onPress={() => void handleLogin()}>
            <Text style={styles.primaryButtonText}>{isLoading ? 'Logging in...' : 'Log in'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default login

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  primaryButton: {
    backgroundColor: '#68b5f5',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 3,
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 8px rgba(15, 110, 86, 0.2)',
      },
      default: {
        shadowColor: '#0F6E56',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
    }),
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.65,
  },
})