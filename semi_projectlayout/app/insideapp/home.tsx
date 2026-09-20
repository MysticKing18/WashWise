import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import { Alert, Animated, Dimensions, Image, ImageSourcePropType, ScrollView, StyleProp, StyleSheet, Text, TextInput, TouchableOpacity, View, ImageStyle } from 'react-native'
import { auth } from '../../firebase/firebase'
import { getUserById } from '../../database/services/userService'

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

const home = () => {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')

  useEffect(() => {
    const loadCustomerName = async () => {
      const currentUser = auth.currentUser
      if (!currentUser) {
        router.replace('/login')
        return
      }

      try {
        const customer = await getUserById(currentUser.uid)
        if (!customer || !customer.isActive) {
          router.replace('/login')
          return
        }

        const name = customer.fullName.trim().split(/\s+/)[0]
        setFirstName(name)
      } catch {
        Alert.alert('Profile unavailable', 'Unable to load your customer profile.')
      }
    }

    void loadCustomerName()
  }, [router])

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#BFE6FB', '#DFF3FD', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />
      <FloatingBubble
        source={require('../../assets/img/bubble1.png')}
        size={70}
        style={{ top: height * 0.08, left: -20 }}
        duration={3800}
        opacity={0.55}
      />
      <FloatingBubble
        source={require('../../assets/img/bubble2.png')}
        size={40}
        style={{ top: height * 0.05, right: 30 }}
        duration={3000}
        delay={200}
        opacity={0.5}
      />
      <FloatingBubble
        source={require('../../assets/img/bubble2.png')}
        size={110}
        style={{ top: height * 0.18, right: -35 }}
        duration={4600}
        delay={400}
        opacity={0.45}
      />
      <FloatingBubble
        source={require('../../assets/img/bubble1.png')}
        size={26}
        style={{ top: height * 0.32, left: 40 }}
        duration={2600}
        delay={600}
        opacity={0.6}
      />
      <FloatingBubble
        source={require('../../assets/img/bubble2.png')}
        size={55}
        style={{ bottom: height * 0.28, left: -15 }}
        duration={4000}
        delay={100}
        opacity={0.5}
      />
      <FloatingBubble
        source={require('../../assets/img/bubble1.png')}
        size={90}
        style={{ bottom: height * 0.16, right: -25 }}
        duration={5200}
        delay={300}
        opacity={0.4}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/img/logo.png')}
            style={[styles.logo, styles.headerElementOffset]}
            resizeMode="contain"
          />
          <Text style={[styles.brandName, styles.headerElementOffset]}>WashWise</Text>
          <TouchableOpacity accessibilityLabel="Notifications" style={[styles.bellButton, styles.headerElementOffset]}>
            <Ionicons name="notifications-outline" size={22} color="#2563EB" />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>

        <Text style={styles.greeting}>Hello, {firstName || '...'}!</Text>
        <Text style={styles.description}>Ready for a fresh laundry?</Text>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search laundry shop..."
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <LinearGradient
          colors={['#60A5FA', '#2563EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.promoBanner}
        >
          <Image
            source={require('../../assets/img/bubble1.png')}
            style={styles.bubbleLarge}
            resizeMode="contain"
          />
          <Image
            source={require('../../assets/img/bubble2.png')}
            style={styles.bubbleSmall}
            resizeMode="contain"
          />
          <View style={styles.promoTextWrap}>
            <Text style={styles.promoTitle}>Clean Clothes{'\n'}Brighter Days</Text>
            <Text style={styles.promoSubtitle}>Same-Day Wash & Fold{'\n'}Book in seconds</Text>
          </View>
          <View style={styles.promoIconWrap}>
            <Ionicons name="shirt-outline" size={40} color="#FFFFFF" />
          </View>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Laundry Stores</Text>
          <TouchableOpacity>
            <Text style={styles.link}>View All</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.branchCard} activeOpacity={0.85}>
          <View style={styles.branchImagePlaceholder}>
            <Ionicons name="business-outline" size={28} color="#9CA3AF" />
          </View>
          <View style={styles.branchDetails}>
            <Text style={styles.branchName}>Main Branch</Text>
            <View style={styles.branchAddressRow}>
              <Ionicons name="location-outline" size={12} color="#6B7280" />
              <Text style={styles.branchAddress}>Apokon, Tagum City</Text>
            </View>
            <View style={styles.branchMeta}>
              <Text style={styles.branchDistance}>1.2 km</Text>
              <View style={styles.openDot} />
              <Text style={styles.openLabel}>Open</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={30} color="#9CA3AF" />
          <TouchableOpacity style={styles.mapButton}>
            <Text style={styles.mapButtonText}>View on Map</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIconWrap}>
              <Ionicons name="time-outline" size={22} color="#2563EB" />
            </View>
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIconWrap}>
              <Ionicons name="cube-outline" size={22} color="#2563EB" />
            </View>
            <Text style={styles.actionText}>Track Order</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/insideapp/home')}>
          <Ionicons name="home" size={24} color="#2563EB" />
          <Text style={[styles.navLabel, styles.activeNavLabel]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/insideapp/order')}>
          <Ionicons name="receipt-outline" size={24} color="#64748B" />
          <Text style={styles.navLabel}>Order</Text>
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

export default home

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  backgroundBubble: { position: 'absolute' },
  content: { paddingBottom: 24 },
  header: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: { 
    width: 48, height: 48 },
  headerElementOffset: { transform: [{ translateY: 20 }] },
  brandName: { flex: 1, marginLeft: 1, fontSize: 18, fontWeight: '700', color: '#111827' },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  greeting: { marginTop: 8, paddingHorizontal: 16, fontSize: 24, fontWeight: '800', color: '#111827' },
  description: { marginTop: 2, paddingHorizontal: 16, fontSize: 13, color: '#6B7280' },
  searchBox: {
    height: 44,
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 13, color: '#111827' },
  promoBanner: {
    height: 120,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  bubbleLarge: {
    position: 'absolute',
    width: 90,
    height: 90,
    right: -20,
    top: -25,
    opacity: 0.55,
  },
  bubbleSmall: {
    position: 'absolute',
    width: 40,
    height: 40,
    right: 70,
    bottom: -10,
    opacity: 0.5,
  },
  promoTextWrap: { flex: 1 },
  promoTitle: { fontSize: 17, fontWeight: '800', color: '#FFFFFF', lineHeight: 21 },
  promoSubtitle: { marginTop: 6, fontSize: 10, color: '#DBEAFE', lineHeight: 14 },
  promoIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: { marginTop: 20, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { paddingHorizontal: 16, fontSize: 15, fontWeight: '700', color: '#111827' },
  link: { fontSize: 12, fontWeight: '600', color: '#2563EB' },
  branchCard: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  branchImagePlaceholder: { width: 68, height: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', borderRadius: 8 },
  branchDetails: { flex: 1, marginLeft: 10 },
  branchName: { fontSize: 13, fontWeight: '700', color: '#111827' },
  branchAddressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 3 },
  branchAddress: { fontSize: 11, color: '#6B7280' },
  branchMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 5 },
  branchDistance: { fontSize: 11, color: '#111827', fontWeight: '600' },
  openDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#16A34A' },
  openLabel: { fontSize: 11, fontWeight: '700', color: '#16A34A' },
  mapPlaceholder: {
    height: 96,
    marginHorizontal: 16,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  mapButton: { position: 'absolute', right: 10, bottom: 10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#2563EB' },
  mapButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  quickActions: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 12 },
  actionButton: { flex: 1, alignItems: 'center', paddingVertical: 14, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12 },
  actionIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  actionText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  bottomNav: { height: 64, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  navItem: { alignItems: 'center', justifyContent: 'center', minWidth: 60 },
  navLabel: { marginTop: 3, fontSize: 10, color: '#64748B' },
  activeNavLabel: { color: '#2563EB', fontWeight: '700' },
})