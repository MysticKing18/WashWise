import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useEffect, useRef } from 'react'
import { Animated, Dimensions, ImageSourcePropType, ImageStyle, StyleProp, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const { height } = Dimensions.get('window')

type FloatingBubbleProps = {
  source: ImageSourcePropType
  size: number
  style?: StyleProp<ImageStyle>
  duration?: number
  delay?: number
  opacity?: number
}

const FloatingBubble = ({ source, size, style, duration = 4000, delay = 0, opacity = 0.85 }: FloatingBubbleProps) => {
  const floatAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration, delay, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [delay, duration, floatAnim])

  const translateY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -14] })

  return (
    <Animated.Image
      source={source}
      resizeMode="contain"
      style={[styles.backgroundBubble, { width: size, height: size, opacity, transform: [{ translateY }] }, style]}
    />
  )
}

type StepProps = {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  active?: boolean
  last?: boolean
}

const Step = ({ icon, label, active = false, last = false }: StepProps) => (
  <View style={styles.stepWrap}>
    <View style={[styles.stepCircle, active && styles.activeStepCircle]}>
      <Ionicons name={icon} size={16} color={active ? '#0877D1' : '#8B9AA7'} />
    </View>
    <Text style={[styles.stepLabel, active && styles.activeStepLabel]}>{label}</Text>
    {!last && <View style={styles.stepLine} />}
  </View>
)

const order = () => {
  const router = useRouter()

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#BFE6FB', '#E8F7FD', '#FFFFFF']} style={StyleSheet.absoluteFill} />

      <FloatingBubble source={require('../../assets/img/bubble1.png')} size={74} style={{ top: height * 0.04, left: -24 }} opacity={0.5} />
      <FloatingBubble source={require('../../assets/img/bubble2.png')} size={46} style={{ top: height * 0.08, right: 18 }} duration={3200} opacity={0.5} />
      <FloatingBubble source={require('../../assets/img/bubble2.png')} size={108} style={{ top: height * 0.18, right: -38 }} duration={4600} opacity={0.42} />
      <FloatingBubble source={require('../../assets/img/bubble1.png')} size={30} style={{ top: height * 0.38, left: -10 }} duration={2800} opacity={0.55} />
      <FloatingBubble source={require('../../assets/img/bubble1.png')} size={94} style={{ bottom: height * 0.06, right: -24 }} duration={5200} opacity={0.4} />

      <View style={styles.content}>
        <View style={styles.topBar}>
          <TouchableOpacity accessibilityLabel="Go back to home" onPress={() => router.replace('/insideapp/home')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#0E6BB7" />
          </TouchableOpacity>
          <Text style={styles.title}>New Order</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.steps}>
          <Step icon="location-outline" label="Branch" active />
          <Step icon="shirt-outline" label="Service" />
          <Step icon="list-outline" label="Details" />
          <Step icon="card-outline" label="Payment" last />
        </View>

        <Text style={styles.sectionTitle}>Select Services</Text>

        <View style={styles.serviceCard}>
          <View style={styles.serviceIconCircle}>
            <Ionicons name="location-outline" size={28} color="#0877D1" />
          </View>
          <Text style={styles.serviceMessage}>Please select a branch{`\n`}or main first to proceed{`\n`}with your order.</Text>
          <TouchableOpacity style={styles.pickButton} activeOpacity={0.85} onPress={() => router.push('/insideapp/branches')}>
            <Text style={styles.pickButtonText}>Pick Branch / Main</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/insideapp/home')}>
          <Ionicons name="home" size={24} color="#64748B" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/insideapp/order')}>
          <Ionicons name="receipt-outline" size={24} color="#2563EB" />
          <Text style={[styles.navLabel, styles.activeNavLabel]}>Order</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/insideapp/branches')}>
          <Ionicons name="git-network-outline" size={24} color="#64748B" />
          <Text style={styles.navLabel}>Branches</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/insideapp/profile')}>
          <Ionicons name="person-circle-outline" size={25} color="#64748B" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default order

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  backgroundBubble: { position: 'absolute' },
  content: { flex: 1, paddingHorizontal: 15 },
  topBar: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '700', color: '#075191', transform: [{ translateY: 20 }] },
  topBarSpacer: { width: 32 },
  steps: { height: 55, flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 2, transform: [{ translateY: 25}] },
  stepWrap: { flex: 1, alignItems: 'center', position: 'relative' },
  stepCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.62)', borderWidth: 1, borderColor: '#C2D1DB' },
  activeStepCircle: { backgroundColor: '#D4EDFF', borderColor: '#A5D8FA' },
  stepLabel: { marginTop: 4, fontSize: 8, color: '#8B9AA7' },
  activeStepLabel: { color: '#708798' },
  stepLine: { position: 'absolute', top: 14, left: '62%', width: '76%', height: 1, backgroundColor: '#C5D4DE' },
  sectionTitle: { marginTop: 48, fontSize: 13, fontWeight: '700', color: '#034C8A' },
  serviceCard: { height: 191, marginTop: 34, paddingTop: 17, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 1, borderColor: '#D8E0E5', borderRadius: 17 },
  serviceIconCircle: { width: 56, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#C9E9FF' },
  serviceMessage: { marginTop: 12, textAlign: 'center', fontSize: 11, lineHeight: 13, fontWeight: '600', color: '#202020' },
  pickButton: { position: 'absolute', left: 12, right: 12, bottom: 16, height: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0877D1', borderRadius: 8 },
  pickButtonText: { fontSize: 10, fontWeight: '600', color: '#FFFFFF' },
  bottomNav: { height: 58, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.96)', borderTopWidth: 1, borderTopColor: '#D7E5EE' },
  navItem: { minWidth: 52, alignItems: 'center', justifyContent: 'center' },
  navLabel: { marginTop: 3, fontSize: 10, color: '#64748B' },
  activeNavLabel: { color: '#2563EB', fontWeight: '700' },
})