import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useEffect, useRef } from 'react'
import {
  Animated,
  Dimensions,
  Image,
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Alert } from 'react-native'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase/firebase'
import { getUserById, updateUserPhoto, updateUserProfile } from '../../database/services/userService'
import { User } from '../../database/models/User'
import { LogoutConfirmModal } from '../../components/LogoutConfirmModal'

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
  const [customer, setCustomer] = React.useState<User | null>(null)
  const [isEditing, setIsEditing] = React.useState(false)
  const [fullName, setFullName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [isSaving, setIsSaving] = React.useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false)
  const [showLogout, setShowLogout] = React.useState(false)
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)

  React.useEffect(() => {
    const loadProfile = async () => {
      const currentUser = auth.currentUser
      if (!currentUser) {
        router.replace('/login')
        return
      }

      try {
        const profileData = await getUserById(currentUser.uid)
        if (!profileData || !profileData.isActive) {
          await signOut(auth)
          router.replace('/login')
          return
        }
        setCustomer(profileData)
        setFullName(profileData.fullName)
        setPhone(profileData.phone || '')
      } catch {
        Alert.alert('Profile unavailable', 'Unable to load your profile.')
      }
    }

    void loadProfile()
  }, [router])

  const handleEdit = () => {
    if (!customer) return
    setFullName(customer.fullName)
    setPhone(customer.phone || '')
    setIsEditing(true)
  }

  const handlePhotoPress = async () => {
    const currentUser = auth.currentUser
    if (!currentUser) {
      router.replace('/login')
      return
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) {
        Alert.alert('Permission required', 'Allow photo-library access to change your profile picture.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      })

      if (result.canceled || !result.assets[0]) return

      setIsUploadingPhoto(true)
      const photoURL = await updateUserPhoto(currentUser.uid, result.assets[0].uri)
      setCustomer((previous) => previous ? { ...previous, photoURL } : previous)
    } catch {
      Alert.alert('Photo update failed', 'Unable to select or upload your profile picture right now.')
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleSave = async () => {
    if (!customer || !fullName.trim()) {
      Alert.alert('Invalid profile', 'Full name is required.')
      return
    }

    setIsSaving(true)
    try {
      await updateUserProfile(customer.userId, {
        fullName: fullName.trim(),
        phone: phone.trim(),
      })
      setCustomer({ ...customer, fullName: fullName.trim(), phone: phone.trim() })
      setIsEditing(false)
      Alert.alert('Profile updated', 'Your profile has been saved.')
    } catch {
      Alert.alert('Update failed', 'Unable to save your profile right now.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signOut(auth)
      router.replace('/login')
    } catch {
      Alert.alert('Logout failed', 'Unable to log out right now.')
    } finally {
      setIsLoggingOut(false)
      setShowLogout(false)
    }
  }

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
              <Image source={require('../../assets/img/logo.png')} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Text style={styles.brandText}>WashWise</Text>
          </View>
        </View>

        <View style={styles.titleWrap}>
          <Text style={styles.title}>My Profile</Text>
          <Text style={styles.subtitle}>A cleaner you, a brighter tomorrow.</Text>
        </View>

        <View style={styles.card}>
          <TouchableOpacity style={styles.avatarWrap} activeOpacity={0.85} onPress={handlePhotoPress} disabled={isUploadingPhoto}>
            <View style={styles.avatarBadge}>
              {customer?.photoURL ? (
                <Image source={{ uri: customer.photoURL }} style={styles.profilePhoto} />
              ) : (
                <Ionicons name="person" size={28} color="#FFFFFF" />
              )}
            </View>
            <View style={styles.avatarCamera}>
              <Ionicons name={isUploadingPhoto ? 'hourglass-outline' : 'camera'} size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            {isEditing ? (
              <>
                <TextInput
                  style={styles.profileInput}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Full name"
                  placeholderTextColor="#9CA3AF"
                />
                <Text style={styles.email}>{customer?.email || ''}</Text>
                <TextInput
                  style={styles.profileInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Phone number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              </>
            ) : (
              <>
                <Text style={styles.name}>{customer?.fullName || 'Loading...'}</Text>
                <Text style={styles.email}>{customer?.email || ''}</Text>
                <Text style={styles.phone}>{customer?.phone || ''}</Text>
              </>
            )}
          </View>

          <TouchableOpacity style={styles.editButton} activeOpacity={0.9} onPress={isEditing ? handleSave : handleEdit} disabled={isSaving}>
            <Ionicons name={isEditing ? 'checkmark' : 'pencil'} size={14} color="#FFFFFF" />
            <Text style={styles.editButtonText}>{isSaving ? 'Saving...' : isEditing ? 'Save Profile' : 'Edit Profile'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.9} onPress={() => setShowLogout(true)}>
          <View style={styles.logoutIconWrap}>
            <Ionicons name="log-out-outline" size={20} color="#F15B5B" />
          </View>
          <Text style={styles.logoutText}>Logout</Text>
          <Text style={styles.logoutSubtext}></Text>
          <Ionicons name="chevron-forward" size={18} color="#53779A" style={styles.logoutArrow} />
        </TouchableOpacity>
      </View>

      <LogoutConfirmModal visible={showLogout} loading={isLoggingOut} onCancel={() => setShowLogout(false)} onConfirm={() => void handleLogout()} />

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
          <Ionicons name="person-circle-outline" size={24} color="#2563EB" />
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
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
  },
  header: {
    marginTop: 2,
    alignItems: 'center',
  },
  brandWrap: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoCircle: {
    width: 92,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: 10 }],
  },
  logoImage: {
    width: 86,
    height: 66,
  },
  brandText: {
    display: 'none',
  },
  titleWrap: {
    marginTop: 2,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
  },
  subtitle: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: '500',
    color: '#53657D',
    lineHeight: 14,
    textAlign: 'center',
  },
  card: {
    marginTop: 18,
    minHeight: 104,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E3ECF5',
    shadowColor: '#A7BCD5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 10,
  },
  avatarBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#5CB2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
  },
  avatarCamera: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
    alignItems: 'flex-start',
    paddingBottom: 20,
  },
  name: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F2937',
  },
  email: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: '500',
    color: '#4B5563',
  },
  phone: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: '500',
    color: '#4B5563',
  },
  profileInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#C9DCEB',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 5,
    marginBottom: 6,
    fontSize: 11,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  editButton: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F7AD8',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 9,
    gap: 3,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  logoutButton: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#DFEAF3',
  },
  logoutIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
  },
  logoutSubtext: {
    flex: 1,
    marginLeft: 6,
    fontSize: 8,
    color: '#6B7280',
  },
  logoutArrow: {
    marginLeft: 4,
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