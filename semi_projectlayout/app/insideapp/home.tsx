import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import { LinearGradient } from 'expo-linear-gradient'
import { useFocusEffect, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Animated, Dimensions, Image, ImageSourcePropType, ScrollView, StyleProp, StyleSheet, Text, TextInput, TouchableOpacity, View, ImageStyle } from 'react-native'
import { auth } from '../../firebase/firebase'
import { BRANCH_CATALOG } from '../../database/branchCatalog'
import type { Branch } from '../../database/models/Branch'
import { subscribeToBranches } from '../../database/services/branchService'
import { getUserById } from '../../database/services/userService'
import { getBranchImage, getDistanceInKilometers, openBranchMap } from '../../utils/branchLocation'
import { NotificationBell } from '../../components/NotificationBell'

const { height } = Dimensions.get('window')

type LocationState = 'loading' | 'ready' | 'permission-needed' | 'denied' | 'unavailable'

const formatApproximateDistance = (distanceInKilometers: number) => distanceInKilometers < 1
  ? `${Math.round(distanceInKilometers * 1000)} m away`
  : `${distanceInKilometers.toFixed(distanceInKilometers < 10 ? 1 : 0)} km away`

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
  const [searchQuery, setSearchQuery] = useState('')
  const [branches, setBranches] = useState<Branch[]>(BRANCH_CATALOG)
  const [nearestBranch, setNearestBranch] = useState<Branch | null>(null)
  const [nearestDistance, setNearestDistance] = useState<number | null>(null)
  const [locationState, setLocationState] = useState<LocationState>('loading')
  const [locationMessage, setLocationMessage] = useState('Finding a nearby laundry shop...')
  const branchesRef = useRef<Branch[]>(BRANCH_CATALOG)
  const lastCoordinatesRef = useRef<{ latitude: number; longitude: number } | null>(null)

  const mainBranch = branches.find((branch) => branch.branchId === BRANCH_CATALOG[0].branchId) || BRANCH_CATALOG[0]

  useEffect(() => {
    branchesRef.current = branches
  }, [branches])

  useEffect(() => subscribeToBranches(
    (savedBranches) => setBranches(savedBranches),
    () => setBranches(BRANCH_CATALOG),
  ), [])

  const updateNearestBranch = useCallback((latitude: number, longitude: number) => {
    lastCoordinatesRef.current = { latitude, longitude }
    const candidates = branchesRef.current
      .filter((branch) => branch.isActive)
      .map((branch) => ({ branch, distance: getDistanceInKilometers(latitude, longitude, branch) }))
      .filter((candidate): candidate is { branch: Branch; distance: number } => candidate.distance !== null)
      .sort((left, right) => left.distance - right.distance)
    const nearest = candidates[0]
    if (!nearest) {
      setNearestBranch(null)
      setNearestDistance(null)
      setLocationState('unavailable')
      setLocationMessage('Nearest-shop recommendations need branch coordinates. You can still browse all branches.')
      return
    }
    setNearestBranch(nearest.branch)
    setNearestDistance(nearest.distance)
    setLocationState('ready')
    setLocationMessage('')
  }, [])

  useEffect(() => {
    const coordinates = lastCoordinatesRef.current
    if (coordinates) updateNearestBranch(coordinates.latitude, coordinates.longitude)
  }, [branches, updateNearestBranch])

  useFocusEffect(useCallback(() => {
    let active = true
    let locationSubscription: Location.LocationSubscription | null = null

    const askForLocation = () => new Promise<boolean>((resolve) => {
      Alert.alert(
        'Find a nearby laundry shop',
        'WashWise uses your location only while this screen is open to recommend the closest active branch. You can browse branches manually if you prefer.',
        [
          { text: 'Not now', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Allow location', onPress: () => resolve(true) },
        ],
      )
    })

    const loadNearestBranch = async () => {
      setLocationState('loading')
      setLocationMessage('Finding a nearby laundry shop...')
      try {
        let permission = await Location.getForegroundPermissionsAsync()
        if (permission.status === Location.PermissionStatus.UNDETERMINED) {
          setLocationState('permission-needed')
          if (!(await askForLocation())) {
            setLocationState('denied')
            setLocationMessage('Location was not enabled. Browse all branches to choose a store manually.')
            return
          }
          permission = await Location.requestForegroundPermissionsAsync()
        }
        if (!permission.granted) {
          setLocationState('denied')
          setLocationMessage('Location permission is unavailable. Browse all branches to choose a store manually.')
          return
        }
        if (!(await Location.hasServicesEnabledAsync())) {
          setLocationState('unavailable')
          setLocationMessage('Location services are turned off. Turn them on or browse all branches manually.')
          return
        }

        const currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        if (!active) return
        updateNearestBranch(currentLocation.coords.latitude, currentLocation.coords.longitude)
        locationSubscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 500 },
          (location) => {
            if (active) updateNearestBranch(location.coords.latitude, location.coords.longitude)
          },
        )
        if (!active) locationSubscription.remove()
      } catch {
        if (!active) return
        setLocationState('unavailable')
        setLocationMessage('We could not determine your location. Browse all branches manually.')
      }
    }

    void loadNearestBranch()
    return () => {
      active = false
      locationSubscription?.remove()
    }
  }, [updateNearestBranch]))

  const filteredBranches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return branches

    return branches.filter((branch) =>
      [
        branch.name,
        branch.address,
        branch.location?.city,
        branch.location?.province,
        branch.location?.barangay,
        branch.location?.landmark,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [branches, searchQuery])

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
            <NotificationBell role="customer" color="#2563EB" />
          </TouchableOpacity>
        </View>

        <Text style={styles.greeting}>Hello, {firstName || '...'}!</Text>
        <Text style={styles.description}>Ready for a fresh laundry?</Text>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            placeholder="Search laundry shop..."
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Search laundry shops"
            onSubmitEditing={() => router.push('/insideapp/branches')}
          />
          {!!searchQuery && (
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
              <Ionicons name="close-circle" size={18} color="#7C8FA3" />
            </TouchableOpacity>
          )}
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
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="View all laundry stores" onPress={() => router.push('/insideapp/branches')}>
            <Text style={styles.link}>View All</Text>
          </TouchableOpacity>
        </View>

        {searchQuery.trim() && filteredBranches.length === 0 ? (
          <View style={styles.emptyResultsCard}>
            <Ionicons name="search-outline" size={28} color="#7C8FA3" />
            <Text style={styles.emptyResultsTitle}>No matching shops</Text>
            <Text style={styles.emptyResultsText}>Try another branch name, city, or landmark.</Text>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setSearchQuery('')} style={styles.clearResultsButton}>
              <Text style={styles.clearResultsText}>Clear search</Text>
            </TouchableOpacity>
          </View>
        ) : (
          (searchQuery.trim() ? filteredBranches : [mainBranch]).map((branch) => (
            <TouchableOpacity
              key={branch.branchId}
              accessibilityRole="button"
              accessibilityLabel={`View ${branch.name} details`}
              style={styles.branchCard}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: '/insideapp/order_details', params: { branchId: branch.branchId } })}
            >
              <View style={styles.branchImagePlaceholder}>
                <Image source={getBranchImage(branch)} style={styles.branchImage} resizeMode="cover" />
              </View>
              <View style={styles.branchDetails}>
                <Text style={styles.branchName}>{searchQuery.trim() ? branch.name : 'Main Branch'}</Text>
                <View style={styles.branchAddressRow}>
                  <Ionicons name="location-outline" size={12} color="#6B7280" />
                  <Text style={styles.branchAddress} numberOfLines={1}>{branch.address}</Text>
                </View>
                <View style={styles.branchMeta}>
                  <Text style={styles.branchDistance}>{branch.location?.landmark}</Text>
                  <View style={styles.openDot} />
                  <Text style={styles.openLabel}>Open</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))
        )}

        <View style={styles.mapPlaceholder}>
          <View style={styles.nearestHeadingRow}>
            <View style={styles.nearestHeadingCopy}>
              <Text style={styles.nearestTitle}>Nearest Laundry Shop</Text>
              <Text style={styles.nearestSubtitle}>
                {locationState === 'ready' ? 'Approximate straight-line distance' : 'Location-based recommendation'}
              </Text>
            </View>
            <Ionicons name="navigate-outline" size={24} color="#2563EB" />
          </View>

          {nearestBranch && nearestDistance !== null ? (
            <View style={styles.nearestContent}>
              <Image source={getBranchImage(nearestBranch)} style={styles.nearestImage} resizeMode="cover" />
              <View style={styles.nearestDetails}>
                <Text style={styles.nearestBranchName} numberOfLines={2}>{nearestBranch.name}</Text>
                <Text style={styles.nearestAddress} numberOfLines={3}>{nearestBranch.address}</Text>
                <Text style={styles.nearestDistance}>{formatApproximateDistance(nearestDistance)}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.nearestFallback}>
              <Ionicons name={locationState === 'loading' || locationState === 'permission-needed' ? 'locate-outline' : 'map-outline'} size={28} color="#688399" />
              <Text style={styles.nearestFallbackText}>{locationMessage}</Text>
            </View>
          )}

          {nearestBranch && (
            <View style={styles.nearestActions}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`View ${nearestBranch.name} details`}
                style={styles.nearestSecondaryButton}
                onPress={() => router.push({ pathname: '/insideapp/order_details', params: { branchId: nearestBranch.branchId } })}
              >
                <Text style={styles.nearestSecondaryButtonText}>View details</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Get directions to ${nearestBranch.name}`}
                style={styles.nearestPrimaryButton}
                onPress={() => void openBranchMap(nearestBranch).catch(() => Alert.alert('Maps unavailable', 'Directions are not available on this device.'))}
              >
                <Ionicons name="navigate-outline" size={16} color="#FFFFFF" />
                <Text style={styles.nearestPrimaryButtonText}>Directions</Text>
              </TouchableOpacity>
            </View>
          )}

          {!nearestBranch && locationState !== 'loading' && (
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Browse all branches" style={styles.browseBranchesButton} onPress={() => router.push('/insideapp/branches')}>
              <Text style={styles.mapButtonText}>Browse all branches</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="View order history" style={styles.actionButton} onPress={() => router.replace('/insideapp/history')}>
            <View style={styles.actionIconWrap}>
              <Ionicons name="time-outline" size={22} color="#2563EB" />
            </View>
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Track current orders" style={styles.actionButton} onPress={() => router.replace('/insideapp/order')}>
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
  clearSearchButton: { marginLeft: 8, justifyContent: 'center', alignItems: 'center' },
  emptyResultsCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#F8FBFF',
    borderWidth: 1,
    borderColor: '#DDEAF8',
    borderRadius: 12,
  },
  emptyResultsTitle: { marginTop: 8, fontSize: 14, fontWeight: '700', color: '#111827' },
  emptyResultsText: { marginTop: 4, fontSize: 11, color: '#6B7280', textAlign: 'center' },
  clearResultsButton: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  clearResultsText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
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
  branchImagePlaceholder: { width: 78, height: 66, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', borderRadius: 8, overflow: 'hidden' },
  branchImage: { width: '100%', height: '100%' },
  branchDetails: { flex: 1, minWidth: 0, marginLeft: 12 },
  branchName: { fontSize: 14, lineHeight: 18, fontWeight: '700', color: '#111827' },
  branchAddressRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 4, gap: 4 },
  branchAddress: { flex: 1, fontSize: 12, lineHeight: 16, color: '#6B7280' },
  branchMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 5 },
  branchDistance: { flexShrink: 1, fontSize: 12, lineHeight: 16, color: '#111827', fontWeight: '600' },
  openDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#16A34A' },
  openLabel: { fontSize: 12, fontWeight: '700', color: '#16A34A' },
  mapPlaceholder: {
    minHeight: 185,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 14,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  nearestHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nearestHeadingCopy: { flex: 1, minWidth: 0 },
  nearestTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
  nearestSubtitle: { marginTop: 3, fontSize: 10, lineHeight: 14, color: '#6B7280' },
  nearestContent: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 12, gap: 10 },
  nearestImage: { width: 82, height: 72, borderRadius: 8, backgroundColor: '#DDEAF0' },
  nearestDetails: { flex: 1, minWidth: 0 },
  nearestBranchName: { fontSize: 13, lineHeight: 17, fontWeight: '800', color: '#075191' },
  nearestAddress: { marginTop: 3, fontSize: 10, lineHeight: 14, color: '#5F6B7A' },
  nearestDistance: { marginTop: 5, fontSize: 11, fontWeight: '700', color: '#15914D' },
  nearestFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  nearestFallbackText: { maxWidth: 300, marginTop: 8, fontSize: 11, lineHeight: 16, color: '#688399', textAlign: 'center' },
  nearestActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  nearestSecondaryButton: { flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#8BBFE3', backgroundColor: '#FFFFFF', paddingHorizontal: 8 },
  nearestSecondaryButtonText: { color: '#176A9E', fontSize: 11, fontWeight: '700' },
  nearestPrimaryButton: { flex: 1, minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 8, backgroundColor: '#2563EB', paddingHorizontal: 8 },
  nearestPrimaryButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  browseBranchesButton: { alignSelf: 'center', minHeight: 36, justifyContent: 'center', marginTop: 4, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#2563EB' },
  mapButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  quickActions: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 12 },
  actionButton: { flex: 1, alignItems: 'center', paddingVertical: 14, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12 },
  actionIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  actionText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  bottomNav: { minHeight: 68, paddingVertical: 4, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  navItem: { alignItems: 'center', justifyContent: 'center', minWidth: 60 },
  navLabel: { marginTop: 4, fontSize: 11, color: '#64748B' },
  activeNavLabel: { color: '#2563EB', fontWeight: '700' },
})