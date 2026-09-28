import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useRef, useState } from 'react'
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { signInAdmin } from '../../database/services/adminAuthenticationService'

function errorMessage(error: unknown): string {
  const { code, message } = error as { code?: string; message?: string }
  if (code?.startsWith('admin/') && message) return message
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/wrong-password': 'The email or password is incorrect.',
    'auth/user-not-found': 'The email or password is incorrect.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled. Contact the project owner.',
    'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
    'auth/network-request-failed': 'Check your internet connection and try again.',
    'permission-denied': 'Could not verify administrator access. Check your Firebase permissions.',
    unavailable: 'Could not reach Firebase. Check your connection and try again.',
  }
  return (code && messages[code]) || 'Unable to sign in. Please try again.'
}

export default function AdminLogin() {
  const router = useRouter()
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const busy = useRef(false)

  async function login() {
    if (busy.current) return
    setError('')
    if (!email.trim() || !password) { setError('Enter your admin email and password.'); return }
    busy.current = true
    setLoading(true)
    try {
      await signInAdmin(email, password)
      setPassword('')
      // Returning to the mounted form keeps the staff details already entered.
      if (returnTo === 'createstaff') {
        if (router.canGoBack()) router.back()
        else router.replace('/admin/createstaff')
      } else router.replace('/admin/home')
    } catch (error) { setError(errorMessage(error)) }
    finally { busy.current = false; setLoading(false) }
  }

  return <View style={styles.screen}>
    <LinearGradient colors={['#CCEFFF', '#F5FCFF', '#E4F6FF']} style={StyleSheet.absoluteFill} />
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}><Pressable disabled={loading} accessibilityRole="button" accessibilityLabel="Back" style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace('/admin')}><Ionicons name="chevron-back" size={24} color="#0877C8" /></Pressable><Text style={styles.heading}>Admin Sign In</Text><View style={styles.back} /></View>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <Image source={require('../../assets/img/logo.png')} accessibilityLabel="WashWise" style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Welcome, Admin</Text>
          <Text style={styles.subtitle}>Sign in to create staff accounts and manage your branches.</Text>
          <Text style={styles.label}>Admin Email</Text>
          <TextInput accessibilityLabel="Admin Email" value={email} onChangeText={(value) => { setEmail(value); setError('') }} editable={!loading} autoCapitalize="none" autoCorrect={false} autoComplete="email" keyboardType="email-address" placeholder="Enter your admin email" placeholderTextColor="#93ABC2" style={styles.input} />
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordBox}><TextInput accessibilityLabel="Admin Password" value={password} onChangeText={(value) => { setPassword(value); setError('') }} editable={!loading} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} autoComplete="current-password" placeholder="Enter your password" placeholderTextColor="#93ABC2" style={styles.password} onSubmitEditing={() => void login()} /><Pressable disabled={loading} accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} style={styles.eye} onPress={() => setShowPassword((current) => !current)}><Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#7190AE" /></Pressable></View>
          {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: loading, busy: loading }} disabled={loading} onPress={() => void login()} style={[styles.button, loading && styles.disabled]}>{loading && <ActivityIndicator size="small" color="#FFFFFF" />}<Text style={styles.buttonText}>{loading ? 'Signing in…' : 'Sign In'}</Text></Pressable>
          <Text style={styles.note}>Use the account configured as an administrator by the project owner.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </View>
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#E4F6FF' }, safe: { flex: 1 }, header: { height: 56, flexDirection: 'row', alignItems: 'center' }, back: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }, heading: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#075191' },
  content: { width: '100%', maxWidth: 420, alignSelf: 'center', paddingHorizontal: 28, paddingBottom: 30 }, logo: { width: 112, height: 110, alignSelf: 'center', marginTop: 16 }, title: { fontSize: 22, fontWeight: '700', color: '#075191', textAlign: 'center', marginTop: 6 }, subtitle: { fontSize: 13, lineHeight: 20, color: '#67849F', textAlign: 'center', marginTop: 8, marginBottom: 24 },
  label: { fontSize: 12, fontWeight: '700', color: '#285A88', marginTop: 14, marginBottom: 8 }, input: { height: 48, borderRadius: 8, borderWidth: 1, borderColor: '#D3E3F1', backgroundColor: '#FFFFFF', color: '#204F76', paddingHorizontal: 13, fontSize: 14 }, passwordBox: { height: 48, flexDirection: 'row', borderRadius: 8, borderWidth: 1, borderColor: '#D3E3F1', backgroundColor: '#FFFFFF' }, password: { flex: 1, minWidth: 0, color: '#204F76', paddingHorizontal: 13, fontSize: 14 }, eye: { width: 46, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#B2394B', backgroundColor: '#FFF0F2', padding: 12, borderRadius: 8, fontSize: 12, lineHeight: 18, marginTop: 16 }, button: { height: 49, borderRadius: 8, backgroundColor: '#138FEC', flexDirection: 'row', gap: 10, justifyContent: 'center', alignItems: 'center', marginTop: 24 }, buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' }, disabled: { opacity: 0.6 }, note: { color: '#67849F', fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 16 },
})
