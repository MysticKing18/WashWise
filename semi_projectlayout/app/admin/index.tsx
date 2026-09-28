import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function AdminEntry() {
  const router = useRouter()

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#B8E2F8', '#EAF8FF', '#D5F0FD']} style={StyleSheet.absoluteFill} />
      <Image source={require('../../assets/img/bubble1.png')} style={[styles.bubble, styles.leftBubble]} resizeMode="contain" />
      <Image source={require('../../assets/img/bubble2.png')} style={[styles.bubble, styles.rightBubble]} resizeMode="contain" />
      <Image source={require('../../assets/img/bubble1.png')} style={[styles.bubble, styles.smallBubble]} resizeMode="contain" />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.branding}>
            <Image source={require('../../assets/img/logo.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.portalLabel}>Admin Portal</Text>
          </View>

          <View style={styles.welcomePanel}>
            <View style={styles.shieldCircle}>
              <Ionicons name="shield-checkmark" size={38} color="#FFFFFF" />
            </View>
            <Text style={styles.welcomeTitle}>Welcome Admin!</Text>
            <Text style={styles.welcomeSubtitle}>Access the WashWise Management System</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Proceed to admin sign in"
              onPress={() => router.push('/admin/login')}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressedButton]}
            >
              <Text style={styles.primaryButtonText}>Proceed</Text>
              <Ionicons name="arrow-forward" size={21} color="#FFFFFF" />
            </Pressable>
            <View style={styles.buttonUnderline} />
          </View>
        </View>
      </SafeAreaView>
      <View style={styles.bottomWaveBack} />
      <View style={styles.bottomWaveFront} />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#D5F0FD',
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 18,
  },
  branding: {
    alignItems: 'center',
  },
  logo: {
    width: 166,
    height: 122,
  },
  portalLabel: {
    marginTop: 2,
    color: '#00599E',
    fontSize: 15,
    fontWeight: '700',
  },
  welcomePanel: {
    width: '100%',
    maxWidth: 430,
    minHeight: 194,
    alignItems: 'center',
    paddingTop: 21,
    paddingHorizontal: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(113, 138, 151, 0.55)',
    backgroundColor: 'rgba(247, 252, 255, 0.86)',
    shadowColor: '#52788A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 5,
  },
  shieldCircle: {
    width: 47,
    height: 47,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#075796',
    borderRadius: 24,
  },
  welcomeTitle: {
    marginTop: 8,
    color: '#154C75',
    fontSize: 14,
    fontWeight: '800',
  },
  welcomeSubtitle: {
    marginTop: 6,
    color: '#6C7E8D',
    fontSize: 9,
  },
  primaryButton: {
    width: '100%',
    maxWidth: 380,
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
    marginTop: 10,
    borderRadius: 18,
    backgroundColor: '#0877D1',
    shadowColor: '#2873A0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  pressedButton: {
    opacity: 0.65,
  },
  buttonUnderline: {
    width: '92%',
    height: 4,
    marginTop: 8,
    borderRadius: 2,
    backgroundColor: '#9BD4FA',
  },
  bubble: {
    position: 'absolute',
    opacity: 0.45,
  },
  leftBubble: {
    width: 52,
    height: 52,
    top: 34,
    left: -19,
  },
  rightBubble: {
    width: 86,
    height: 86,
    top: 68,
    right: -19,
  },
  smallBubble: {
    width: 25,
    height: 25,
    top: 126,
    left: 16,
  },
  bottomWaveBack: {
    position: 'absolute',
    height: 28,
    bottom: -17,
    left: -20,
    right: -20,
    borderRadius: 50,
    backgroundColor: '#7EC5EC',
    transform: [{ rotate: '-3deg' }],
  },
  bottomWaveFront: {
    position: 'absolute',
    height: 20,
    bottom: -15,
    left: -20,
    right: -20,
    borderRadius: 50,
    backgroundColor: '#49A3D8',
    transform: [{ rotate: '2deg' }],
  },
})
