import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React, { useRef, useState } from 'react'
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BRANCH_CATALOG } from '../../database/branchCatalog'
import { getBranchImage } from '../../utils/branchLocation'

type ServicePriority = 'regular' | 'rush'

const formatPrice = (amount: number) =>
  amount.toLocaleString('en-PH', { maximumFractionDigits: 2 })

export default function OrderChoice() {
  const router = useRouter()
  const { branchId } = useLocalSearchParams<{ branchId?: string }>()
  const weightInput = useRef<TextInput>(null)
  const [priority, setPriority] = useState<ServicePriority>('regular')
  const [weight, setWeight] = useState('3')
  const [weightTouched, setWeightTouched] = useState(false)
  const [showSummary, setShowSummary] = useState(false)

  const branch = BRANCH_CATALOG.find((item) => item.branchId === branchId) || BRANCH_CATALOG[0]
  const branchName = branch.branchId === 'mr-bee-laundromat-services' ? 'Main Branch' : branch.name
  const services = {
    regular: { label: 'Regular', pricePerKg: branch.regularPrice },
    rush: { label: 'Rush / Express', pricePerKg: branch.rushPrice },
  } satisfies Record<ServicePriority, { label: string; pricePerKg: number }>

  const service = services[priority]
  const normalizedWeight = weight.trim().replace(',', '.')
  const kilograms = Number(normalizedWeight)
  const validWeight = /^\d*\.?\d+$/.test(normalizedWeight)
    && Number.isFinite(kilograms)
    && kilograms > 0
  const estimatedPrice = validWeight
    ? Math.round(kilograms * service.pricePerKg * 100) / 100
    : null
  const priceLabel = estimatedPrice === null ? '—' : formatPrice(estimatedPrice)
  const showWeightError = weightTouched && !validWeight

  const handleContinue = () => {
    setWeightTouched(true)
    if (!validWeight) {
      weightInput.current?.focus()
      return
    }

    Keyboard.dismiss()
    // Review only; order submission belongs to the next step of the workflow.
    setShowSummary(true)
  }

  const handleBack = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/insideapp/order')
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <LinearGradient
          colors={['#C8EAFB', '#F5FBFF', '#DDF3FE']}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
        <Image source={require('../../assets/img/bubble1.png')} resizeMode="contain" style={[styles.bubble, styles.topLeftBubble]} />
        <Image source={require('../../assets/img/bubble2.png')} resizeMode="contain" style={[styles.bubble, styles.topRightBubble]} />
        <Image source={require('../../assets/img/bubble2.png')} resizeMode="contain" style={[styles.bubble, styles.sideBubble]} />
        <View style={styles.bottomWave} />
        <Image source={require('../../assets/img/bubble1.png')} resizeMode="contain" style={[styles.bubble, styles.bottomLeftBubble]} />
        <Image source={require('../../assets/img/bubble2.png')} resizeMode="contain" style={[styles.bubble, styles.bottomRightBubble]} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={styles.safeArea} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topBar}>
              <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={handleBack} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
                <Ionicons name="arrow-back" size={23} color="#0877C8" />
              </Pressable>
              <Text accessibilityRole="header" style={styles.title}>New Order</Text>
              <View style={styles.topBarSpacer} />
            </View>

            <View style={styles.branchCard}>
              <Image source={getBranchImage(branch)} style={styles.branchImage} resizeMode="cover" accessibilityLabel={`${branchName} storefront`} />
              <View style={styles.branchInfo}>
                <Text style={styles.branchName}>{branchName}</Text>
                <Text style={styles.branchAddress}>{branch.address}</Text>
              </View>
            </View>

            <View accessibilityRole="tablist" style={styles.serviceTabs}>
              {(['regular', 'rush'] as const).map((option) => (
                <Pressable
                  key={option}
                  accessibilityRole="tab"
                  accessibilityLabel={services[option].label}
                  accessibilityState={{ selected: priority === option }}
                  aria-selected={priority === option}
                  onPress={() => setPriority(option)}
                  style={({ pressed }) => [styles.serviceTab, priority === option && styles.selectedTab, pressed && styles.pressed]}
                >
                  <Text style={[styles.tabLabel, priority === option && styles.selectedTabLabel]}>{services[option].label}</Text>
                </Pressable>
              ))}
            </View>

            <Text accessibilityRole="header" style={styles.sectionTitle}>Service</Text>
            <View style={styles.serviceCard}>
              <View style={styles.serviceIcon}>
                {priority === 'regular'
                  ? <MaterialCommunityIcons name="washing-machine" size={48} color="#0783E9" />
                  : <Ionicons name="shirt-outline" size={43} color="#0783E9" />}
              </View>
              <View style={styles.serviceDetails}>
                <Text style={styles.serviceName}>{service.label}</Text>
                <Text style={styles.serviceDescription}>Basic Washing</Text>
                <Text style={styles.serviceRate}>₱{service.pricePerKg}/kg</Text>
              </View>
              <View style={styles.checkmark}>
                <Ionicons name="checkmark" size={19} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text nativeID="weight-label" style={styles.fieldLabel}>Weight (by KG)</Text>
              <View style={[styles.inputRow, showWeightError && styles.inputError]}>
                <MaterialCommunityIcons name="weight-kilogram" size={25} color="#0877C8" />
                <TextInput
                  ref={weightInput}
                  accessibilityLabel="Weight in kilograms"
                  accessibilityLabelledBy="weight-label"
                  accessibilityHint="Enter the estimated weight of your laundry."
                  aria-invalid={showWeightError}
                  style={styles.weightInput}
                  value={weight}
                  onChangeText={setWeight}
                  onBlur={() => setWeightTouched(true)}
                  placeholder="Ex. 3 kg"
                  placeholderTextColor="#8B9AA6"
                  keyboardType="decimal-pad"
                  inputMode="decimal"
                  maxLength={7}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                  selectionColor="#0877D1"
                />
                <Text style={styles.weightUnit}>kg</Text>
              </View>
              {showWeightError && <Text accessibilityRole="alert" style={styles.errorText}>Enter a valid weight greater than 0 kg.</Text>}
            </View>

            <View style={styles.estimateGroup}>
              <Text style={styles.fieldLabel}>Estimated Price</Text>
              <View style={styles.inputRow} accessibilityLabel={`Estimated price: ${priceLabel} pesos`}>
                <Text style={styles.pesoSymbol}>₱</Text>
                <Text style={styles.estimatedValue}>{priceLabel}</Text>
              </View>
            </View>

            <LinearGradient colors={['#E8F6FF', '#D6EDFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.totalCard}>
              <Text style={styles.totalLabel}>Estimated Total</Text>
              <Text accessibilityLiveRegion="polite" style={styles.totalAmount}>₱ {priceLabel}</Text>
              <Text style={styles.totalNote}>Final price confirmed at drop-off.</Text>
            </LinearGradient>

            <View style={styles.footer}>
              <Pressable accessibilityRole="button" onPress={handleContinue} style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}>
                <Text style={styles.continueButtonText}>Continue</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal visible={showSummary} transparent animationType="fade" onRequestClose={() => setShowSummary(false)}>
        <SafeAreaView style={styles.modalOverlay}>
          <View role="dialog" aria-modal accessibilityLabel="Review your estimate" accessibilityViewIsModal style={styles.summaryCard}>
            <ScrollView contentContainerStyle={styles.summaryContent} showsVerticalScrollIndicator={false}>
              <Text accessibilityRole="header" style={styles.summaryTitle}>Review your estimate</Text>
              <Text style={styles.summaryBranch}>{branchName}</Text>
              <Text style={styles.summaryDetails}>{service.label} · {normalizedWeight} kg × ₱{service.pricePerKg}/kg</Text>
              <Text style={styles.summaryAmount}>₱ {priceLabel}</Text>
              <Text style={styles.summaryNote}>Staff will verify the weight and final price at drop-off. Payment is made in person at pickup.</Text>
              <Text style={styles.summaryNotice}>No order has been placed yet.</Text>
              <Pressable accessibilityRole="button" onPress={() => setShowSummary(false)} style={({ pressed }) => [styles.continueButton, styles.summaryButton, pressed && styles.pressed]}>
                <Text style={styles.continueButtonText}>Back to order</Text>
              </Pressable>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#E4F4FD' },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  content: { flexGrow: 1, width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 26, paddingBottom: 24 },
  bubble: { position: 'absolute', opacity: 0.36 },
  topLeftBubble: { width: 200, height: 200, top: -105, left: -65 },
  topRightBubble: { width: 130, height: 130, top: 42, right: -44, opacity: 0.24 },
  sideBubble: { width: 75, height: 75, top: '46%', left: -43, opacity: 0.23 },
  bottomLeftBubble: { width: 285, height: 285, bottom: -135, left: -94, opacity: 0.44 },
  bottomRightBubble: { width: 170, height: 170, bottom: 5, right: -72, opacity: 0.32 },
  bottomWave: { position: 'absolute', width: '140%', height: 120, bottom: -54, left: '-15%', borderRadius: 160, backgroundColor: 'rgba(255,255,255,0.53)', transform: [{ rotate: '-14deg' }] },
  topBar: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -12, borderRadius: 22 },
  topBarSpacer: { width: 32 },
  title: { fontSize: 20, fontWeight: '700', color: '#075191', textAlign: 'center' },
  branchCard: { flexDirection: 'row', alignItems: 'center', minHeight: 78, gap: 13 },
  branchImage: { width: 94, height: 76, borderRadius: 10, backgroundColor: '#C6E4F6' },
  branchInfo: { flex: 1 },
  branchName: { color: '#084E85', fontSize: 14, fontWeight: '700', marginBottom: 5 },
  branchAddress: { color: '#638097', fontSize: 11, lineHeight: 16 },
  serviceTabs: { flexDirection: 'row', gap: 8, marginTop: 18, marginBottom: 27 },
  serviceTab: { flex: 1, minHeight: 46, borderRadius: 9, backgroundColor: '#91CEFA', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 12 },
  selectedTab: { backgroundColor: '#0879DA' },
  tabLabel: { fontSize: 14, fontWeight: '700', color: '#104E7B', textAlign: 'center' },
  selectedTabLabel: { color: '#FFFFFF' },
  sectionTitle: { color: '#075191', fontSize: 24, fontWeight: '700', marginBottom: 12 },
  serviceCard: { minHeight: 102, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 13, borderWidth: 1, borderColor: '#ADD7FC', backgroundColor: 'rgba(243,250,255,0.82)', borderRadius: 11 },
  serviceIcon: { width: 69, height: 75, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#C5E7FF', borderWidth: 1, borderColor: '#85C7FF' },
  serviceDetails: { flex: 1 },
  serviceName: { color: '#075191', fontSize: 18, fontWeight: '700', marginBottom: 3 },
  serviceDescription: { color: '#61809A', fontSize: 12, lineHeight: 18 },
  serviceRate: { color: '#3774A5', fontSize: 12, lineHeight: 18 },
  checkmark: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#65B9F4' },
  fieldGroup: { marginTop: 22 },
  fieldLabel: { color: '#075191', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  inputRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 13, borderWidth: 1, borderColor: '#D8EAF5', backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 6 },
  weightInput: { flex: 1, minWidth: 0, minHeight: 46, paddingVertical: 10, fontSize: 16, color: '#234D68' },
  weightUnit: { fontSize: 12, color: '#7691A3' },
  inputError: { borderColor: '#C64949' },
  errorText: { fontSize: 12, color: '#AC3030', marginTop: 7, lineHeight: 17 },
  estimateGroup: { marginTop: 17 },
  pesoSymbol: { width: 25, fontSize: 23, color: '#0877C8', textAlign: 'center' },
  estimatedValue: { fontSize: 16, color: '#375E77', fontVariant: ['tabular-nums'] },
  totalCard: { marginTop: 20, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: '#C9E6FC' },
  totalLabel: { color: '#0879E1', fontSize: 15, fontWeight: '600' },
  totalAmount: { marginTop: 4, color: '#0575EC', fontSize: 30, fontWeight: '700', fontVariant: ['tabular-nums'] },
  totalNote: { marginTop: 5, fontSize: 11, lineHeight: 16, color: '#527B9A' },
  footer: { marginTop: 'auto', paddingTop: 24 },
  continueButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#0879DA', paddingHorizontal: 20, paddingVertical: 13 },
  continueButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.75 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: 'rgba(10,46,76,0.42)' },
  summaryCard: { width: '100%', maxWidth: 380, maxHeight: '90%', borderRadius: 20, backgroundColor: '#F5FBFF', overflow: 'hidden' },
  summaryContent: { padding: 24 },
  summaryTitle: { color: '#075191', fontSize: 22, fontWeight: '700' },
  summaryBranch: { marginTop: 18, color: '#234D68', fontSize: 15, fontWeight: '600' },
  summaryDetails: { marginTop: 7, color: '#527B9A', fontSize: 14, lineHeight: 21 },
  summaryAmount: { marginTop: 16, color: '#0575EC', fontSize: 32, fontWeight: '700' },
  summaryNote: { marginTop: 14, color: '#527B9A', fontSize: 14, lineHeight: 21 },
  summaryNotice: { marginTop: 12, color: '#527B9A', fontSize: 12, lineHeight: 18 },
  summaryButton: { marginTop: 22 },
})
