import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useRef, useState } from 'react'
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
} from 'react-native'

const logo = require('../assets/img/logo.png')
const bubblePair = require('../assets/img/bubble1.png')
const bubbleSingle = require('../assets/img/bubble2.png')

const bubbles = [
  { x: 0.02, size: 104, duration: 15000, start: 0.74, paired: true },
  { x: 0.80, size: 136, duration: 19000, start: 0.88, paired: false },
  { x: 0.17, size: 38, duration: 11500, start: 0.44, paired: false },
  { x: 0.92, size: 62, duration: 14000, start: 0.48, paired: false },
  { x: -0.08, size: 148, duration: 20000, start: 0.20, paired: false },
  { x: 0.72, size: 100, duration: 16500, start: 0.17, paired: true },
  { x: 0.40, size: 32, duration: 12500, start: 0.94, paired: false },
  { x: 0.30, size: 48, duration: 14000, start: 0.04, paired: false },
]

function RisingBubble({
  source, size, x, height, duration, start, reduceMotion,
}: {
  source: ImageSourcePropType
  size: number
  x: number
  height: number
  duration: number
  start: number
  reduceMotion: boolean
}) {
  const progress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    progress.setValue(start)
    if (reduceMotion) return

    let active = true
    const firstRise = Animated.timing(progress, {
      toValue: 1, duration: duration * (1 - start), easing: Easing.linear,
      useNativeDriver: Platform.OS !== 'web', isInteraction: false,
    })
    const loop = Animated.loop(Animated.timing(progress, {
      toValue: 1, duration, easing: Easing.linear,
      useNativeDriver: Platform.OS !== 'web', isInteraction: false,
    }))

    firstRise.start(({ finished }) => {
      if (!finished || !active) return
      // Reset below the screen; the bubble is invisible at both ends of its path.
      progress.setValue(0)
      loop.start()
    })
    return () => { active = false; firstRise.stop(); loop.stop() }
  }, [duration, progress, reduceMotion, start])

  return <Animated.Image
    source={source}
    accessible={false}
    resizeMode="contain"
    style={{
      position: 'absolute', left: x, top: 0, width: size, height: size,
      opacity: progress.interpolate({ inputRange: [0, 0.12, 0.88, 1], outputRange: [0, 0.62, 0.62, 0] }),
      transform: [
        { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [height + size, -size * 2] }) },
        { translateX: progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 16, -8] }) },
      ],
    }}
  />
}

function LoadingDots({ reduceMotion }: { reduceMotion: boolean }) {
  const pulse = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (reduceMotion) { pulse.setValue(0.5); return }
    const loop = Animated.loop(Animated.timing(pulse, {
      toValue: 1, duration: 1500, easing: Easing.linear,
      useNativeDriver: Platform.OS !== 'web', isInteraction: false,
    }))
    loop.start()
    return () => loop.stop()
  }, [pulse, reduceMotion])

  return <View style={styles.dots} accessible={false}>
    {[0, 1, 2].map((dot) => <Animated.View key={dot} style={[
      styles.dot,
      { opacity: pulse.interpolate({
        inputRange: [0, 0.2 + dot * 0.15, 0.5 + dot * 0.15, 1],
        outputRange: [0.3, 1, 0.3, 0.3],
      }) },
    ]} />)}
  </View>
}

type StartupLoadingScreenProps = {
  ready: boolean
  onFinish: () => void
  onLayout?: () => void
}

export function StartupLoadingScreen({ ready, onFinish, onLayout }: StartupLoadingScreenProps) {
  const { width, height } = useWindowDimensions()
  const [reduceMotion, setReduceMotion] = useState(true)
  const opacity = useRef(new Animated.Value(1)).current
  const heroSize = Math.min(300, width * 0.76, height * 0.42)

  useEffect(() => {
    let active = true
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled)
    }).catch(() => { /* Keep the static design if the system preference is unavailable. */ })
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion)
    return () => { active = false; subscription.remove() }
  }, [])

  useEffect(() => {
    if (!ready) return
    const fade = Animated.timing(opacity, {
      toValue: 0, duration: reduceMotion ? 0 : 350,
      useNativeDriver: Platform.OS !== 'web', isInteraction: false,
    })
    fade.start(({ finished }) => { if (finished) onFinish() })
    return () => fade.stop()
  }, [onFinish, opacity, ready, reduceMotion])

  return <Animated.View
    testID="startup-loading-screen"
    onLayout={onLayout}
    accessibilityViewIsModal
    accessibilityLabel="Loading WashWise"
    accessibilityRole="progressbar"
    accessibilityState={{ busy: true }}
    style={[styles.screen, { opacity }]}
  >
    <LinearGradient colors={['#E6F4FE', '#F5FBFF', '#DFF3FF']} style={StyleSheet.absoluteFill} />
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {bubbles.map((bubble, index) => <RisingBubble
        key={index}
        {...bubble}
        source={bubble.paired ? bubblePair : bubbleSingle}
        x={width * bubble.x}
        size={bubble.size * Math.min(width / 390, 1.4)}
        height={height}
        reduceMotion={reduceMotion}
      />)}
    </View>

    <View style={[styles.content, { paddingHorizontal: width < 350 ? 20 : 32 }]}>
      <Text style={styles.eyebrow}>A FRESH START</Text>
      <View style={[styles.hero, { width: heroSize, height: heroSize }]}>
        <View style={[styles.outerRing, { borderRadius: heroSize / 2 }]} />
        <View style={[styles.innerRing, { borderRadius: heroSize / 2 }]} />
        <Image
          source={logo}
          accessibilityLabel="WashWise"
          resizeMode="contain"
          style={{ width: heroSize * 0.86, height: heroSize * 0.86 }}
        />
      </View>
      <Text style={styles.tagline}>Clean clothes, hassle-free.</Text>
      <View style={styles.loading}>
        <LoadingDots reduceMotion={reduceMotion} />
        <Text style={styles.loadingText}>Getting things ready…</Text>
      </View>
    </View>
  </Animated.View>
}

const styles = StyleSheet.create({
  screen: { ...StyleSheet.absoluteFill, zIndex: 10, backgroundColor: '#E6F4FE', overflow: 'hidden', justifyContent: 'center' },
  content: { width: '100%', alignItems: 'center', paddingVertical: 24 },
  eyebrow: { color: '#427D9D', fontSize: 10, fontWeight: '700', letterSpacing: 3.2, textAlign: 'center', marginBottom: 22 },
  hero: { alignItems: 'center', justifyContent: 'center' },
  outerRing: { ...StyleSheet.absoluteFill, borderWidth: 1, borderColor: 'rgba(69, 153, 206, 0.14)' },
  innerRing: { position: 'absolute', top: '6%', bottom: '6%', left: '6%', right: '6%', backgroundColor: 'rgba(255, 255, 255, 0.72)', borderWidth: 1, borderColor: '#FFFFFF' },
  tagline: { color: '#365F79', fontSize: 15, fontWeight: '500', textAlign: 'center', lineHeight: 22, marginTop: 22 },
  loading: { alignItems: 'center', marginTop: 38 },
  dots: { flexDirection: 'row', gap: 7, height: 12, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#168FD0' },
  loadingText: { color: '#597C91', fontSize: 11, lineHeight: 18, marginTop: 10 },
})
