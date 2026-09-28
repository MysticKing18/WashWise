import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useRef, useState } from 'react'
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { signInStaff } from '../../database/services/staffAuthenticationService'

function loginError(error: unknown): string {
  const { code, message } = error as { code?: string; message?: string }
  if (code?.startsWith('staff/') && message) return message
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/wrong-password': 'The email or password is incorrect.',
    'auth/user-not-found': 'The email or password is incorrect.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/user-disabled': 'This login has been disabled. Please contact your administrator.',
    'auth/too-many-requests': 'Too many login attempts. Please wait and try again.',
    'auth/network-request-failed': 'Unable to connect. Check your internet connection and try again.',
    'permission-denied': 'Could not verify staff access. Please contact your administrator.',
    unavailable: 'Could not verify your staff profile. Check your connection and try again.',
  }
  return (code && messages[code]) || 'Unable to log in. Please try again.'
}

export default function StaffLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const loggingIn = useRef(false)
  const handleLogin = async () => {
    if (loggingIn.current) return
    const trimmedEmail = email.trim().toLowerCase()
    setErrorMessage('')
    if (!trimmedEmail || !password) { setErrorMessage('Enter your email and password.'); return }
    loggingIn.current = true
    setIsLoading(true)
    try {
      await signInStaff(trimmedEmail, password)
      setPassword('')
      router.replace('/staff/home')
    } catch (error) { setErrorMessage(loginError(error)) }
    finally { loggingIn.current = false; setIsLoading(false) }
  }
  return <View style={styles.screen}><LinearGradient colors={['#BEE9FF', '#F7FCFF', '#FFFFFF']} style={StyleSheet.absoluteFill} />
    <Image source={require('../../assets/img/bubble1.png')} style={styles.bubble} resizeMode="contain" />
    <View style={styles.content}><Image source={require('../../assets/img/logo.png')} style={styles.logo} resizeMode="contain" /><Text style={styles.title}>WashWise</Text><Text style={styles.subtitle}>Staff Panel</Text>
      <Text style={styles.label}>Email</Text><TextInput accessibilityLabel="Staff email" editable={!isLoading} value={email} onChangeText={(value) => { setEmail(value); setErrorMessage('') }} style={styles.input} placeholder="Enter your email" placeholderTextColor="#A1B0BA" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" />
      <Text style={styles.label}>Password</Text><View style={styles.passwordWrap}><TextInput accessibilityLabel="Staff password" editable={!isLoading} value={password} onChangeText={(value) => { setPassword(value); setErrorMessage('') }} style={[styles.input, styles.password]} placeholder="Enter your password" placeholderTextColor="#A1B0BA" secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} autoComplete="current-password" onSubmitEditing={() => void handleLogin()} /><Pressable disabled={isLoading} accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} onPress={() => setShowPassword((value) => !value)} style={styles.eye}><Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#8297A7" /></Pressable></View>
      {!!errorMessage && <Text accessibilityRole="alert" style={feedbackStyles.error}>{errorMessage}</Text>}
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: isLoading, busy: isLoading }} disabled={isLoading} onPress={() => void handleLogin()} style={[styles.button, isLoading && styles.disabled]}><Text style={styles.buttonText}>{isLoading ? 'Logging in...' : 'Log in'}</Text></Pressable>
    </View>
  </View>
}

const feedbackStyles = StyleSheet.create({ error: { color: '#AF3546', backgroundColor: '#FFF0F1', borderRadius: 6, padding: 10, fontSize: 12, lineHeight: 18, marginTop: 14 } })

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#FFFFFF' }, bubble: { position: 'absolute', width: 115, height: 115, top: 22, right: -47, opacity: 0.38 }, content: { width: '100%', maxWidth: 360, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 58 }, logo: { width: 82, height: 65, alignSelf: 'center' }, title: { color: '#075191', fontSize: 16, fontWeight: '800', textAlign: 'center', marginTop: -3 }, subtitle: { color: '#6B879B', fontSize: 8, textAlign: 'center', marginBottom: 36 }, label: { color: '#355B73', fontSize: 9, fontWeight: '700', marginBottom: 5, marginTop: 10 }, input: { height: 34, color: '#264C63', fontSize: 9, lineHeight: 12, paddingHorizontal: 10, borderRadius: 5, borderWidth: 1, borderColor: '#D8E5EC', backgroundColor: '#FFFFFF' }, passwordWrap: { flexDirection: 'row', alignItems: 'center' }, password: { flex: 1, paddingRight: 36 }, eye: { position: 'absolute', right: 8, padding: 4 }, button: { height: 34, alignItems: 'center', justifyContent: 'center', marginTop: 22, borderRadius: 5, backgroundColor: '#168CDD' }, disabled: { opacity: 0.6 }, buttonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' } })
