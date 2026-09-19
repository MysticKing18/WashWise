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

const profile = () => {
  const router = useRouter()

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#BFEAFD', '#DFF5FF', '#FFFFFF']} style={StyleSheet.absoluteFill} />

      <FloatingBubble source={require('../../assets/img/bubble1.png')} size={74} style={{ top: height * 0.07, left: -22 }} opacity={0.5} />
      <FloatingBubble source={require('../../assets/img/bubble2.png')} size={42} style={{ top: height * 0.09, right: 18 }} duration={3300} opacity={0.5} />
      <FloatingBubble source={require('../../assets/img/bubble2.png')} size={110} style={{ top: height * 0.2, right: -35 }} duration={4700} opacity={0.38} />
      <FloatingBubble source={require('../../assets/img/bubble1.png')} size={52} style={{ bottom: height * 0.22, left: 10 }} duration={2600} opacity={0.5} />
      <FloatingBubble source={require('../../assets/img/bubble1.png')} size={80} style={{ bottom: height * 0.02, right: -20 }} duration={5400} opacity={0.4} />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.brandWrap}>
            <View style={styles.logoCircle}>
              <Ionicons name="shirt-outline" size={24} color="#0F7AD8" />
            </View>
            <Text style={styles.brandText}>WashWise</Text>
          </View>
        </View>

        <View style={styles.titleWrap}>
          <Text style={styles.title}>My Profile</Text>
          <Text style={styles.subtitle}>A cleaner you, a brighter tomorrow.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarBadge}>
              <Ionicons name="person" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.avatarCamera}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.name}>Luke Dela Cruz</Text>
            <Text style={styles.email}>luke.delacruz@email.com</Text>
            <Text style={styles.phone}>+63 912 345 6789</Text>
          </View>

          <TouchableOpacity style={styles.editButton} activeOpacity={0.9}>
            <Ionicons name="pencil" size={14} color="#FFFFFF" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.9}>
          <View style={styles.logoutIconWrap}>
            <Ionicons name="log-out-outline" size={20} color="#F15B5B" />
          </View>
          <Text style={styles.logoutText}>Logout</Text>
          <Text style={styles.logoutSubtext}>Sign out of your account</Text>
          <Ionicons name="chevron-forward" size={18} color="#53779A" style={styles.logoutArrow} />
        </TouchableOpacity>
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
          <Ionicons name="git-network-outline" size={24} color="#64748B" />
          <Text style={styles.navLabel}>Branches</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/insideapp/profile')}>
          <Ionicons name="person" size={25} color="#2563EB" />
          <Text style={[styles.navLabel, styles.activeNavLabel]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default profile

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  backgroundBubble: { position: 'absolute' },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 6,
  },
  header: {
    marginTop: 6,
    alignItems: 'flex-start',
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAF7FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFE4FF',
  },
  brandText: {
    marginLeft: 10,
    fontSize: 22,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: -0.5,
  },
  titleWrap: {
    marginTop: 16,
    marginLeft: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '500',
    color: '#53657D',
    lineHeight: 22,
  },
  card: {
    marginTop: 22,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: '#E3ECF5',
    shadowColor: '#A7BCD5',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarWrap: {
    alignSelf: 'center',
    marginBottom: 14,
    position: 'relative',
  },
  avatarBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#5CB2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarCamera: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    alignItems: 'center',
  },
  name: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1F2937',
  },
  email: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
  },
  phone: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
  },
  editButton: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F7AD8',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    gap: 6,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  logoutButton: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#DFEAF3',
  },
  logoutIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    marginLeft: 12,
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  logoutSubtext: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: '#6B7280',
  },
  logoutArrow: {
    marginLeft: 8,
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