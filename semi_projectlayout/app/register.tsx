import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import React, { useState } from 'react'
import { useRouter } from 'expo-router'
import { Alert } from 'react-native'
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../firebase/firebase'
import { createUser } from '../database/services/userService'

const register = () => {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleRegister = async () => {
    const trimmedName = fullName.trim()
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedPhone = phoneNumber.trim()

    if (!trimmedName || !trimmedEmail || !trimmedPhone || !password || !confirmPassword) {
      Alert.alert('Missing information', 'Please complete all fields.')
      return
    }

    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.')
      return
    }

    try {
      const credential = await createUserWithEmailAndPassword(auth, trimmedEmail, password)
      await createUser({
        userId: credential.user.uid,
        fullName: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
      })
      await signOut(auth)
      Alert.alert('Account created', 'Your account is ready. Please log in.', [
        { text: 'Continue', onPress: () => router.replace('/login') },
      ])
    } catch (error: any) {
      const message = error?.code === 'auth/email-already-in-use'
        ? 'That email is already registered.'
        : error?.code === 'auth/weak-password'
          ? 'Your password is too weak.'
          : 'Registration failed. Please try again.'
      Alert.alert('Registration failed', message)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image
            source={require('../assets/img/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Sign up to start booking laundry</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionLabel}>Personal details</Text>
          <View style={styles.detailsRow}>
            <View style={[styles.inputGroup, styles.halfInputGroup]}>
              <Text style={styles.label}>Full name</Text>
              <TextInput
                style={styles.input}
                placeholder="Juan Dela Cruz"
                placeholderTextColor="#9CA3AF"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfInputGroup]}>
              <Text style={styles.label}>Phone no.</Text>
              <TextInput
                style={styles.input}
                placeholder="09XXXXXXXXX"
                placeholderTextColor="#9CA3AF"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <Text style={[styles.sectionLabel, styles.accountSectionLabel]}>Account security</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Create a password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword((visible) => !visible)}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={21}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm password</Text>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Re-enter your password"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword((visible) => !visible)}
                accessibilityLabel={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={21}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleRegister}>
            <Text style={styles.primaryButtonText}>Sign up</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.footerLink}>Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default register

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
    marginBottom: 32,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  sectionLabel: {
    marginBottom: 10,
    color: '#2475AD',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  accountSectionLabel: {
    marginTop: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    columnGap: 10,
  },
  inputGroup: {
    marginBottom: 18,
  },
  halfInputGroup: {
    flex: 1,
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
  passwordInputWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: '#298fdd',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  footerLink: {
    fontSize: 14,
    color: '#4898e4',
    fontWeight: '700',
  },
})