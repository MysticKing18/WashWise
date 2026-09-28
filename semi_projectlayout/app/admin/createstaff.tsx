import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LogoutConfirmModal } from '../../components/LogoutConfirmModal'
import { BRANCH_CATALOG } from '../../database/branchCatalog'
import { subscribeToBranches } from '../../database/services/branchService'
import { createStaffLoginAccount } from '../../database/services/staffProvisioningService'
import { auth, db } from '../../firebase/firebase'

type BranchOption = { branchId: string; name: string; address: string }
type Form = { fullName: string; email: string; password: string; confirmPassword: string; branchId: string }
type FormErrors = Partial<Record<keyof Form, string>>
type Access = 'checking' | 'allowed' | 'denied' | 'error'
const emptyForm: Form = { fullName: '', email: '', password: '', confirmPassword: '', branchId: '' }
const catalogBranches: BranchOption[] = BRANCH_CATALOG
  .filter((branch) => branch.isActive)
  .map(({ branchId, name, address }) => ({ branchId, name, address }))

function creationError(error: unknown): string {
  const { code, message } = error as { code?: string; message?: string }
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'This email already has a sign-in account. Use a different email, or ask your administrator to check the existing account.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/weak-password': 'Choose a stronger temporary password with at least 6 characters.',
    'auth/password-does-not-meet-requirements': 'This password does not meet your project’s requirements. Try a longer password with uppercase and lowercase letters, a number, and a symbol.',
    'auth/operation-not-allowed': 'Email/password sign-in needs to be enabled in Firebase Authentication.',
    'auth/network-request-failed': 'Could not reach Firebase. Check your connection and try again.',
    'auth/too-many-requests': 'Too many attempts. Please wait before trying again.',
    'permission-denied': 'Your admin account does not have permission to save this staff record.',
    unavailable: 'Firebase is unavailable. Check your connection and try again.',
  }
  return (code && messages[code]) || (code?.startsWith('staff/') && message) || 'Could not create the staff account. Check your connection and try again.'
}

export default function CreateStaff() {
  const router = useRouter()
  const [form, setForm] = useState<Form>(emptyForm)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [branches, setBranches] = useState<BranchOption[]>(catalogBranches)
  const [branchesLoading, setBranchesLoading] = useState(false)
  const [branchError, setBranchError] = useState('')
  const [retry, setRetry] = useState(0)
  const [access, setAccess] = useState<Access>('checking')
  const [branchPickerOpen, setBranchPickerOpen] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [showLogout, setShowLogout] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const savingRef = useRef(false)
  const selectedBranch = branches.find((branch) => branch.branchId === form.branchId)
  const disabled = saving || loggingOut
  const canSubmit = !disabled && access === 'allowed' && !branchesLoading && branches.length > 0

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeProfile?.()
      setAccess(user ? 'checking' : 'denied')
      if (!user) return
      unsubscribeProfile = onSnapshot(doc(db, 'staffAccounts', user.uid), (snapshot) => {
        const profile = snapshot.data()
        setAccess(profile?.role === 'admin' && profile?.isActive === true ? 'allowed' : 'denied')
      }, () => setAccess('error'))
    })
    return () => { unsubscribeAuth(); unsubscribeProfile?.() }
  }, [retry])

  useEffect(() => {
    if (access !== 'allowed') {
      setBranches(catalogBranches); setBranchesLoading(false); setBranchPickerOpen(false)
      return
    }
    setBranchesLoading(true); setBranchError('')
    return subscribeToBranches((savedBranches) => {
      const branchOptions = savedBranches
        .filter((branch) => branch.isActive)
        .map((branch) => ({ branchId: branch.branchId, name: branch.name, address: branch.address }))
        .sort((a, b) => a.name.localeCompare(b.name))
      setBranches(branchOptions)
      setForm((current) => branchOptions.some((branch) => branch.branchId === current.branchId) ? current : { ...current, branchId: '' })
      setBranchError(''); setBranchesLoading(false)
    }, () => { setBranches([]); setBranchesLoading(false); setBranchError('Could not load branches. Check your connection and try again.') })
  }, [access, retry])

  function change(field: keyof Form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined, ...(field === 'password' ? { confirmPassword: undefined } : {}) }))
    setSubmitError(''); setSuccess('')
  }

  async function handleCreate() {
    if (savingRef.current) return
    setSubmitError(''); setSuccess('')
    const nextErrors: FormErrors = {}
    if (!form.fullName.trim()) nextErrors.fullName = 'Enter the staff member’s full name.'
    else if (form.fullName.trim().length > 120) nextErrors.fullName = 'Use a full name of up to 120 characters.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = 'Enter a valid email address.'
    if (form.password.length < 6) nextErrors.password = 'Use at least 6 characters.'
    if (!form.confirmPassword || form.confirmPassword !== form.password) nextErrors.confirmPassword = 'Passwords must match.'
    if (!selectedBranch) nextErrors.branchId = 'Select an active branch.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    if (access !== 'allowed') { setSubmitError('Sign in with an active admin account to create staff.'); return }
    Keyboard.dismiss(); savingRef.current = true; setSaving(true)
    try {
      await createStaffLoginAccount({ fullName: form.fullName.trim(), email: form.email.trim(), password: form.password, branchId: form.branchId })
      setSuccess('Staff account created successfully.')
      setForm(emptyForm); setShowPassword(false); setShowConfirmation(false); setErrors({})
    } catch (error) { setSubmitError(creationError(error)) }
    finally { savingRef.current = false; setSaving(false) }
  }

  const fieldError = (field: keyof Form) => errors[field] ? <Text accessibilityRole="alert" style={styles.fieldError}>{errors[field]}</Text> : null
  const retryButton = <Pressable accessibilityRole="button" onPress={() => setRetry((value) => value + 1)}><Text style={styles.link}>Retry</Text></Pressable>

  return <View style={styles.screen}>
    <StatusBar style="dark" />
    <LinearGradient colors={['#D3F0FF', '#F6FCFF', '#DCF4FF']} locations={[0, 0.43, 1]} style={StyleSheet.absoluteFill} />
    <View pointerEvents="none" style={styles.topWave} /><View pointerEvents="none" style={styles.bottomWave} />
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image source={require('../../assets/img/bubble1.png')} style={styles.topBubble} resizeMode="contain" />
      <Image source={require('../../assets/img/bubble2.png')} style={styles.bottomBubble} resizeMode="contain" />
    </View>
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable disabled={disabled} onPress={() => router.replace('/admin/staff')} accessibilityRole="button" accessibilityLabel="Back to staff" style={styles.backButton}><Ionicons name="chevron-back" size={23} color="#0572CA" /></Pressable>
        <Text style={styles.title}>Create Staff Account</Text><View style={styles.headerSpacer} />
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <View style={styles.brand}><Image source={require('../../assets/img/logo.png')} accessibilityLabel="WashWise" style={styles.logo} resizeMode="contain" /><Text style={styles.subtitle}>Create a new staff account to give them{`\n`}access to the WashWise system.</Text></View>
            <View style={styles.field}><Text style={styles.label}>Full Name</Text><TextInput accessibilityLabel="Full Name" value={form.fullName} onChangeText={(value) => change('fullName', value)} editable={!disabled} placeholder="Enter staff’s full name" placeholderTextColor="#9CB5D2" autoCapitalize="words" autoComplete="off" style={[styles.input, errors.fullName && styles.invalidInput]} />{fieldError('fullName')}</View>
            <View style={styles.field}><Text style={styles.label}>Email</Text><TextInput accessibilityLabel="Email" value={form.email} onChangeText={(value) => change('email', value)} editable={!disabled} placeholder="you@washwise.com" placeholderTextColor="#9CB5D2" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="off" style={[styles.input, errors.email && styles.invalidInput]} />{fieldError('email')}</View>
            <View style={styles.field}>
              <Text style={styles.label}> Password</Text>
              <View style={[styles.passwordBox, errors.password && styles.invalidInput]}><TextInput accessibilityLabel=" Password" value={form.password} onChangeText={(value) => change('password', value)} editable={!disabled} placeholder="Enter password" placeholderTextColor="#9CB5D2" secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} autoComplete="new-password" style={styles.passwordInput} /><Pressable disabled={disabled} accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} onPress={() => setShowPassword((value) => !value)} style={styles.eyeButton}><Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#799ABF" /></Pressable></View>
              {fieldError('password')}
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={[styles.passwordBox, errors.confirmPassword && styles.invalidInput]}><TextInput accessibilityLabel="Confirm Password" value={form.confirmPassword} onChangeText={(value) => change('confirmPassword', value)} editable={!disabled} placeholder="Re-enter password" placeholderTextColor="#9CB5D2" secureTextEntry={!showConfirmation} autoCapitalize="none" autoCorrect={false} autoComplete="new-password" style={styles.passwordInput} /><Pressable disabled={disabled} accessibilityRole="button" accessibilityLabel={showConfirmation ? 'Hide confirm password' : 'Show confirm password'} onPress={() => setShowConfirmation((value) => !value)} style={styles.eyeButton}><Ionicons name={showConfirmation ? 'eye-off-outline' : 'eye-outline'} size={18} color="#799ABF" /></Pressable></View>
              {fieldError('confirmPassword')}
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Assign Branch</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Assign Branch" accessibilityState={{ expanded: branchPickerOpen, disabled: disabled || branchesLoading || !branches.length }} disabled={disabled || branchesLoading || !branches.length} onPress={() => { Keyboard.dismiss(); setBranchPickerOpen(true) }} style={[styles.branchSelect, errors.branchId && styles.invalidInput]}><Text numberOfLines={1} style={[styles.branchLabel, !selectedBranch && styles.placeholder]}>{branchesLoading ? 'Loading branches…' : selectedBranch?.name || 'Select a branch'}</Text>{branchesLoading ? <ActivityIndicator size="small" color="#138DEA" /> : <Ionicons name="chevron-down" size={15} color="#0572CA" />}</Pressable>
              {fieldError('branchId')}
              {!!branchError && <View><Text style={styles.fieldError}>{branchError}</Text>{retryButton}</View>}
              {access === 'allowed' && !branchesLoading && !branchError && !branches.length && <Text style={styles.fieldError}>No active branches available. Activate a branch before creating staff.</Text>}
            </View>
            {access === 'checking' && <Text accessibilityLiveRegion="polite" style={styles.accessMessage}>Checking admin access…</Text>}
            {access === 'denied' && <View style={styles.notice}><Text accessibilityRole="alert" style={styles.noticeText}>Admin sign-in is required before you can create a staff account.</Text><Pressable disabled={disabled} accessibilityRole="button" onPress={() => router.push({ pathname: '/admin/login', params: { returnTo: 'createstaff' } })}><Text style={styles.link}>Sign in as admin</Text></Pressable></View>}
            {access === 'error' && <View style={styles.notice}><Text style={styles.noticeText}>Could not check your admin access. Check your connection.</Text>{retryButton}</View>}
            {!!submitError && <Text accessibilityRole="alert" style={styles.errorBanner}>{submitError}</Text>}
            {!!success && <View accessibilityLiveRegion="polite" style={styles.successBanner}><Ionicons name="checkmark-circle" size={21} color="#198456" /><Text style={styles.successText}>{success}</Text></View>}
          </View>
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: !canSubmit, busy: saving }} disabled={!canSubmit} onPress={() => void handleCreate()} style={({ pressed }) => [styles.createButton, !canSubmit && styles.disabled, pressed && styles.pressed]}>{saving && <ActivityIndicator size="small" color="#FFFFFF" />}<Text style={styles.createText}>{saving ? 'Creating Account…' : 'Create Account'}</Text></Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={styles.bottomNav}>
        {([['Home', 'home', '/admin/home'], ['Staff', 'people', '/admin/staff'], ['Payments', 'card', '/admin/payment']] as const).map(([label, icon, path]) => <Pressable key={label} disabled={disabled} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: label === 'Staff', disabled }} onPress={() => router.replace(path)} style={styles.navItem}><Ionicons name={icon} size={27} color={label === 'Staff' ? '#0866BD' : '#6D8BA7'} /><Text style={[styles.navLabel, label === 'Staff' && styles.activeNav]}>{label}</Text></Pressable>)}
        <Pressable disabled={disabled} accessibilityRole="button" accessibilityLabel="Log out" onPress={() => setShowLogout(true)} style={styles.navItem}><Ionicons name="log-out-outline" size={28} color="#6D8BA7" /><Text style={styles.navLabel}>Log Out</Text></Pressable>
      </View>
    </SafeAreaView>
    <Modal transparent visible={branchPickerOpen} animationType="fade" onRequestClose={() => setBranchPickerOpen(false)}>
      <View style={styles.modalOverlay}><View accessibilityViewIsModal style={styles.branchModal}>
        <View style={styles.modalHeading}><Text style={styles.modalTitle}>Assign Branch</Text><Pressable accessibilityRole="button" accessibilityLabel="Close branch selection" onPress={() => setBranchPickerOpen(false)} style={styles.closeButton}><Ionicons name="close" size={23} color="#587C9E" /></Pressable></View>
        <Text style={styles.modalSubtitle}>Choose the branch this staff member will manage.</Text>
        <ScrollView style={styles.branchList}>{branches.map((branch) => <Pressable key={branch.branchId} accessibilityRole="radio" accessibilityState={{ checked: form.branchId === branch.branchId }} onPress={() => { change('branchId', branch.branchId); setBranchPickerOpen(false) }} style={[styles.branchOption, form.branchId === branch.branchId && styles.selectedOption]}><Ionicons name="business-outline" size={23} color="#1689DB" /><View style={styles.optionCopy}><Text style={styles.optionName}>{branch.name}</Text><Text style={styles.optionAddress}>{branch.address}</Text></View><Ionicons name={form.branchId === branch.branchId ? 'radio-button-on' : 'radio-button-off'} size={21} color="#1689DB" /></Pressable>)}</ScrollView>
      </View></View>
    </Modal>
    <LogoutConfirmModal visible={showLogout} loading={loggingOut} onCancel={() => setShowLogout(false)} onConfirm={async () => {
      if (savingRef.current) return
      setLoggingOut(true)
      try { await signOut(auth); router.replace('/admin') } catch { setSubmitError('Could not log out. Please try again.') }
      finally { setLoggingOut(false); setShowLogout(false) }
    }} />
  </View>
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#E5F7FF' }, flex: { flex: 1 }, safeArea: { flex: 1 },
  topWave: { position: 'absolute', width: 360, height: 155, borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.46)', top: -105, left: -85, transform: [{ rotate: '-22deg' }] }, bottomWave: { position: 'absolute', width: 620, height: 330, borderRadius: 250, backgroundColor: 'rgba(153,220,253,0.28)', bottom: -105, left: -95, transform: [{ rotate: '-20deg' }] },
  topBubble: { position: 'absolute', width: 175, height: 175, right: -34, top: -70, opacity: 0.55 }, bottomBubble: { position: 'absolute', width: 135, height: 135, left: -25, bottom: 55, opacity: 0.5 },
  header: { width: '100%', maxWidth: 460, alignSelf: 'center', height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }, backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, headerSpacer: { width: 44 }, title: { flex: 1, color: '#004A9D', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  content: { width: '100%', maxWidth: 440, alignSelf: 'center', paddingHorizontal: 24, paddingBottom: 18 }, formCard: { backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 13, paddingHorizontal: 16, paddingBottom: 8 },
  brand: { alignItems: 'center', paddingBottom: 18 }, logo: { width: 108, height: 104 }, subtitle: { fontSize: 12, lineHeight: 18, color: '#678CB8', textAlign: 'center', marginTop: 2 },
  field: { marginBottom: 15 }, label: { color: '#054995', fontSize: 12, fontWeight: '700', marginBottom: 8 }, input: { height: 46, borderWidth: 1, borderColor: '#D7E6F7', borderRadius: 8, backgroundColor: '#F8FBFF', paddingHorizontal: 13, color: '#164F8C', fontSize: 12 },
  passwordBox: { flexDirection: 'row', alignItems: 'center', height: 46, borderWidth: 1, borderColor: '#D7E6F7', borderRadius: 8, backgroundColor: '#F8FBFF' }, passwordInput: { flex: 1, minWidth: 0, height: '100%', paddingHorizontal: 13, fontSize: 12, color: '#164F8C' }, eyeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, invalidInput: { borderColor: '#D86A71' }, fieldError: { color: '#B63E4D', fontSize: 11, lineHeight: 16, marginTop: 5 },
  branchSelect: { flexDirection: 'row', alignItems: 'center', height: 46, borderWidth: 1, borderColor: '#D7E6F7', borderRadius: 8, backgroundColor: '#F8FBFF', paddingHorizontal: 13, gap: 8 }, branchLabel: { flex: 1, color: '#2368AA', fontSize: 12 }, placeholder: { color: '#8CA8C4' },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, paddingVertical: 10 }, infoText: { flex: 1, color: '#6089B6', fontSize: 11, lineHeight: 17 }, link: { color: '#0679CE', fontWeight: '700', fontSize: 12, paddingVertical: 9 },
  notice: { backgroundColor: '#EBF5FF', borderRadius: 8, paddingHorizontal: 12, paddingTop: 10, marginTop: 6 }, noticeText: { color: '#486E96', fontSize: 12, lineHeight: 18 }, accessMessage: { color: '#6089B6', textAlign: 'center', fontSize: 12, padding: 10 },
  errorBanner: { backgroundColor: '#FFF0F0', color: '#B13D4B', padding: 12, borderRadius: 8, fontSize: 12, lineHeight: 18, marginTop: 8 }, successBanner: { flexDirection: 'row', gap: 8, backgroundColor: '#E9F9F1', padding: 12, borderRadius: 8, marginTop: 8 }, successText: { flex: 1, color: '#226746', fontSize: 12, lineHeight: 18 },
  createButton: { marginTop: 17, height: 50, backgroundColor: '#138FEC', borderRadius: 8, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' }, createText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' }, disabled: { opacity: 0.55 }, pressed: { opacity: 0.8 },
  bottomNav: { minHeight: 68, flexDirection: 'row', paddingTop: 8, paddingBottom: 7, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#D3E7F5' }, navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 }, navLabel: { color: '#6D8BA7', fontSize: 11 }, activeNav: { color: '#0866BD', fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(10,43,76,0.35)', padding: 22 }, branchModal: { width: '100%', maxWidth: 420, maxHeight: '75%', backgroundColor: '#F8FCFF', borderRadius: 18, padding: 18 }, modalHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, modalTitle: { color: '#075191', fontSize: 18, fontWeight: '700' }, closeButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }, modalSubtitle: { color: '#6988A3', fontSize: 12, lineHeight: 18, marginBottom: 14 }, branchList: { flexGrow: 0 },
  branchOption: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#D7E6F3', backgroundColor: '#FFFFFF', borderRadius: 10, padding: 12, marginBottom: 9 }, selectedOption: { backgroundColor: '#EAF6FF', borderColor: '#2098ED' }, optionCopy: { flex: 1 }, optionName: { fontSize: 13, fontWeight: '700', color: '#185D96' }, optionAddress: { fontSize: 11, lineHeight: 16, marginTop: 4, color: '#718EA5' },
})
