import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useEffect, useRef } from 'react'
import {
  Animated,
  Dimensions,
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

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

type BranchCardProps = {
  name?: string
  address?: string
  distance?: string
  rating?: string
  selected?: boolean
  popular?: boolean
  imageSource: any
}

const BranchCard = ({ name = '', address = '', distance = '', rating = '', selected = false, popular = false, imageSource }: BranchCardProps) => (
  <TouchableOpacity
    activeOpacity={0.9}
    style={[styles.branchCard, selected && styles.selectedBranchCard]}
  >
    <View style={styles.branchImage}>
      <Animated.Image
        source={imageSource}
        resizeMode="cover"
        style={styles.branchImageSource}
      />
    </View>

    <View style={styles.branchInfo}>
      <View style={styles.branchNameRow}>
        <Text style={styles.branchName}>{name || ' '}</Text>
        {popular && <View style={styles.popularBadge}><Text style={styles.popularText}>Popular</Text></View>}
      </View>

      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={12} color="#5F6B7A" />
        <Text style={styles.branchAddress}>{address || ' '}</Text>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaGroup}>
          <Ionicons name="navigate-outline" size={12} color="#4B5563" />
          <Text style={styles.branchDistance}>{distance || ' '}</Text>
        </View>
        <View style={styles.metaSpacer} />
        <View style={styles.openGroup}>
          <Ionicons name="ellipse" size={8} color="#1CA65C" />
          <Text style={styles.openLabel}>Open</Text>
        </View>
      </View>

      <View style={styles.ratingRow}>
        <Ionicons name="star" size={12} color="#F4B740" />
        <Text style={styles.ratingText}>{rating || ' '}</Text>
      </View>
    </View>

    <View style={styles.arrowWrap}>
      <Ionicons name="chevron-forward" size={20} color="#7A869A" />
    </View>
  </TouchableOpacity>
)

const branches = () => {
  const router = useRouter()

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#BDE5FB', '#DFF3FD', '#FFFFFF']} style={StyleSheet.absoluteFill} />

      <FloatingBubble source={require('../../assets/img/bubble1.png')} size={60} style={{ top: height * 0.06, left: -14 }} opacity={0.45} />
      <FloatingBubble source={require('../../assets/img/bubble2.png')} size={40} style={{ top: height * 0.11, right: 12 }} duration={3400} opacity={0.5} />
      <FloatingBubble source={require('../../assets/img/bubble2.png')} size={92} style={{ top: height * 0.18, right: -28 }} duration={4700} opacity={0.4} />
      <FloatingBubble source={require('../../assets/img/bubble1.png')} size={28} style={{ top: height * 0.32, left: 22 }} duration={2500} opacity={0.55} />
      <FloatingBubble source={require('../../assets/img/bubble2.png')} size={70} style={{ bottom: height * 0.28, left: -18 }} duration={4200} opacity={0.42} />
      <FloatingBubble source={require('../../assets/img/bubble1.png')} size={88} style={{ bottom: height * 0.12, right: -18 }} duration={5200} opacity={0.38} />

      <View style={styles.content}>
        <View style={styles.topBar}>
          <TouchableOpacity accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#0E6BB7" />
          </TouchableOpacity>
          <Text style={styles.title}>Choose a Branch</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <Text style={styles.subtitle}>Select the most convenient location for you</Text>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#7A869A" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search branch..."
            placeholderTextColor="#7A869A"
          />
        </View>

        <View style={styles.list}>
          <BranchCard
            name=""
            address=""
            distance=""
            rating=""
            selected
            popular
            imageSource={require('../../assets/img/Laundry1.png')}
          />
          <BranchCard
            name=""
            address=""
            distance=""
            rating=""
            imageSource={require('../../assets/img/Laundry2.png')}
          />
          <BranchCard
            name=""
            address=""
            distance=""
            rating=""
            imageSource={require('../../assets/img/Laundry3.png')}
          />
        </View>
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/insideapp/home')}>
          <Ionicons name="home-outline" size={24} color="#64748B" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/insideapp/order')}>
          <Ionicons name="receipt-outline" size={24} color="#64748B" />
          <Text style={styles.navLabel}>Order</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/insideapp/branches')}>
          <Ionicons name="git-network-outline" size={24} color="#2563EB" />
          <Text style={[styles.navLabel, styles.activeNavLabel]}>Branches</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/insideapp/profile')}>
          <Ionicons name="person-circle-outline" size={25} color="#64748B" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default branches

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  backgroundBubble: { position: 'absolute' },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 8,
  },
  topBar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
  },
  topBarSpacer: { width: 30 },
  subtitle: {
    marginTop: 12,
    fontSize: 14,
    color: '#5F6B7A',
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: '#D9E3EB',
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 0,
  },
  list: {
    marginTop: 6,
  },
  branchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4EAF0',
    padding: 12,
    marginBottom: 12,
    shadowColor: '#B5CAEA',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedBranchCard: {
    borderColor: '#A958FF',
    borderWidth: 2,
    shadowColor: '#9F6BFF',
    shadowOpacity: 0.18,
  },
  branchImage: {
    width: 82,
    height: 78,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#DDEEFF',
    borderWidth: 1,
    borderColor: '#D9EAF8',
  },
  branchImageSource: {
    width: '100%',
    height: '100%',
  },
  branchInfo: {
    flex: 1,
    marginLeft: 10,
  },
  branchNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  branchName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  popularBadge: {
    backgroundColor: '#D5E3FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  popularText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2E5BDB',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  branchAddress: {
    marginLeft: 4,
    fontSize: 12,
    color: '#4B5563',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  metaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  branchDistance: {
    marginLeft: 4,
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  metaSpacer: {
    width: 8,
  },
  openGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  openLabel: {
    marginLeft: 4,
    fontSize: 12,
    color: '#1F9D61',
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 11,
    color: '#374151',
    fontWeight: '700',
  },
  arrowWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNav: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#D9E6EE',
  },
  navItem: {
    minWidth: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    marginTop: 3,
    fontSize: 10,
    color: '#64748B',
  },
  activeNavLabel: {
    color: '#2563EB',
    fontWeight: '700',
  },
})
