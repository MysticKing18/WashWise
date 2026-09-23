import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase/firebase'

export default function StaffLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const handleLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail || !password) { Alert.alert('Missing information', 'Enter your email and password.'); return }
    setIsLoading(true)
    try {
      const credential = await signInWithEmailAndPassword(auth, trimmedEmail, password)
      const snapshot = await getDoc(doc(db, 'staffAccounts', credential.user.uid))
      const staff = snapshot.data() as { role?: string; isActive?: boolean } | undefined
      if (!snapshot.exists() || !['staff', 'admin'].includes(staff?.role || '') || staff?.isActive !== true) {
        Alert.alert('Access denied', 'This account is not configured as an active staff account.')
        return
      }
      router.replace('/staff/home')
    } catch (error: any) {
      Alert.alert('Login failed', error?.code === 'auth/invalid-credential' ? 'The email or password is incorrect.' : 'Unable to log in. Check your connection and try again.')
    } finally { setIsLoading(false) }
  }
  return <View style={styles.screen}><LinearGradient colors={['#BEE9FF', '#F7FCFF', '#FFFFFF']} style={StyleSheet.absoluteFill} />
    <Image source={require('../../assets/img/bubble1.png')} style={styles.bubble} resizeMode="contain" />
    <View style={styles.content}><Image source={require('../../assets/img/logo.png')} style={styles.logo} resizeMode="contain" /><Text style={styles.title}>WashWise</Text><Text style={styles.subtitle}>Staff Panel</Text>
      <Text style={styles.label}>Email</Text><TextInput value={email} onChangeText={setEmail} style={styles.input} placeholder="you@example.com" placeholderTextColor="#A1B0BA" keyboardType="email-address" autoCapitalize="none" />
      <Text style={styles.label}>Password</Text><View style={styles.passwordWrap}><TextInput value={password} onChangeText={setPassword} style={[styles.input, styles.password]} placeholder="Enter your password" placeholderTextColor="#A1B0BA" secureTextEntry={!showPassword} /><Pressable onPress={() => setShowPassword((value) => !value)} style={styles.eye}><Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#8297A7" /></Pressable></View>
      <Pressable disabled={isLoading} onPress={() => void handleLogin()} style={[styles.button, isLoading && styles.disabled]}><Text style={styles.buttonText}>{isLoading ? 'Logging in...' : 'Log in'}</Text></Pressable>
    </View>
  </View>
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#FFFFFF' }, bubble: { position: 'absolute', width: 115, height: 115, top: 22, right: -47, opacity: 0.38 }, content: { width: '100%', maxWidth: 360, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 58 }, logo: { width: 82, height: 65, alignSelf: 'center' }, title: { color: '#075191', fontSize: 16, fontWeight: '800', textAlign: 'center', marginTop: -3 }, subtitle: { color: '#6B879B', fontSize: 8, textAlign: 'center', marginBottom: 36 }, label: { color: '#355B73', fontSize: 9, fontWeight: '700', marginBottom: 5, marginTop: 10 }, input: { height: 34, flex: 1, color: '#264C63', fontSize: 9, paddingHorizontal: 10, borderRadius: 5, borderWidth: 1, borderColor: '#D8E5EC', backgroundColor: '#FFFFFF' }, passwordWrap: { flexDirection: 'row', alignItems: 'center' }, password: { paddingRight: 36 }, eye: { position: 'absolute', right: 8, padding: 4 }, button: { height: 34, alignItems: 'center', justifyContent: 'center', marginTop: 22, borderRadius: 5, backgroundColor: '#168CDD' }, disabled: { opacity: 0.6 }, buttonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' } })