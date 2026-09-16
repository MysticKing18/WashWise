import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useRef } from 'react'
import { Animated, Dimensions, Image, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const choice = () => {
  const router = useRouter()
  const sheetTranslateY = useRef(new Animated.Value(0)).current
  const sheetStartY = useRef(0)
  const { height } = Dimensions.get('window')

  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 4,
      onPanResponderGrant: () => {
        sheetTranslateY.stopAnimation((value) => {
          sheetStartY.current = value
        })
      },
      onPanResponderMove: (_, gestureState) => {
        const nextPosition = sheetStartY.current + gestureState.dy
        const minimumPosition = -(height * 0.22)
        const maximumPosition = 18

        sheetTranslateY.setValue(
          Math.max(minimumPosition, Math.min(maximumPosition, nextPosition))
        )
      },
      onPanResponderRelease: (_, gestureState) => {
        const nextPosition = sheetStartY.current + gestureState.dy
        const minimumPosition = -(height * 0.22)
        const maximumPosition = 18
        const boundedPosition = Math.max(minimumPosition, Math.min(maximumPosition, nextPosition))

        Animated.spring(sheetTranslateY, {
          toValue: boundedPosition,
          useNativeDriver: true,
          bounciness: 5,
        }).start()
      },
    })
  ).current

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#BFE6FB', '#DFF3FD', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      <Image
        source={require('../assets/img/bubble1.png')}
        style={[styles.bubble, styles.bubbleTopLeft]}
        resizeMode="contain"
      />
      <Image
        source={require('../assets/img/bubble2.png')}
        style={[styles.bubble, styles.bubbleTopRight]}
        resizeMode="contain"
      />
      <Image
        source={require('../assets/img/bubble2.png')}
        style={[styles.bubble, styles.bubbleBottomLeft]}
        resizeMode="contain"
      />
      <Image
        source={require('../assets/img/bubble1.png')}
        style={[styles.bubble, styles.bubbleBottomRight]}
        resizeMode="contain"
      />

      <View style={styles.branding}>
        <Image
          source={require('../assets/img/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.tagline}>Clean Clothes. Hassle-Free</Text>
      </View>

      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}
      >
        <View style={styles.grabberTouchArea} {...sheetPanResponder.panHandlers}>
          <View style={styles.grabber} />
        </View>
        <Text style={styles.sheetTitle}>Laundry made simple.</Text>
        <Text style={styles.sheetSubtitle}>Fresh days ahead!</Text>

        <View style={styles.caseBox}>
          <Text style={styles.caseLabel}>YOUR LAUNDRY CASE</Text>
          <Text style={styles.caseTitle}>Ready when you are</Text>
          <Text style={styles.caseText}>Log in or create an account to get started.</Text>
        </View>

        <TouchableOpacity
          style={styles.loginButton}
          activeOpacity={0.85}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.createButton}
          activeOpacity={0.85}
          onPress={() => router.push('/register')}
        >
          <Text style={styles.createButtonText}>Create Account</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

export default choice

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  bubble: {
    position: 'absolute',
    opacity: 0.55,
  },
  bubbleTopLeft: {
    width: 72,
    height: 72,
    top: 22,
    left: -18,
  },
  bubbleTopRight: {
    width: 82,
    height: 82,
    top: 12,
    right: -26,
  },
  bubbleBottomLeft: {
    width: 58,
    height: 58,
    bottom: 72,
    left: -18,
  },
  bubbleBottomRight: {
    width: 90,
    height: 90,
    bottom: 100,
    right: -28,
  },
  branding: {
    alignItems: 'center',
    marginTop: 66,
  },
  logo: {
    width: 190,
    height: 190,
    marginTop: 40,
  },
  tagline: {
    marginTop: -12,
    color: '#0868b3',
    fontSize: 14,
    fontWeight: '500',
  },
  sheet: {
    width: '100%',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 100,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    shadowColor: '#4B9DD1',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  grabberTouchArea: {
    alignItems: 'center',
    minHeight: -9,
  },
  grabber: {
    alignSelf: 'center',
    width: 46,
    height: 4,
    marginBottom: 10,
    borderRadius: 2,
    backgroundColor: '#91CBEA',
  },
  sheetTitle: {
    color: '#174C70',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  sheetSubtitle: {
    marginTop: 4,
    marginBottom: 12,
    color: '#6B8798',
    fontSize: 11,
    textAlign: 'center',
  },
  caseBox: {
    marginBottom: 14,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(117, 190, 232, 0.45)',
    backgroundColor: 'rgba(218, 243, 255, 0.72)',
    textAlign: 'center',
  },
  caseLabel: {
    color: '#4A8FB8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  caseTitle: {
    marginTop: 3,
    color: '#17577E',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  caseText: {
    marginTop: 3,
    color: '#668394',
    fontSize: 11,
    textAlign: 'center',
  },
  loginButton: {
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 22,
    backgroundColor: '#0878D1',
    shadowColor: '#247FB8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 3,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  createButton: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 11,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#75C6F2',
    backgroundColor: 'rgba(255, 255, 255, 0.62)',
  },
  createButtonText: {
    color: '#4DA7D9',
    fontSize: 14,
    fontWeight: '600',
  },
})