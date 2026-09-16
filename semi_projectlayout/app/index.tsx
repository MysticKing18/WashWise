import { StyleSheet, Text, View, Image, TouchableOpacity, Animated, Dimensions, ImageSourcePropType, StyleProp, ImageStyle } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'

const { width, height } = Dimensions.get('window')

type FloatingBubbleProps = {
  source: ImageSourcePropType
  size: number
  style?: StyleProp<ImageStyle>
  duration?: number
  delay?: number
  opacity?: number
}

// Reusable floating bubble component — drifts gently up/down forever
const FloatingBubble = ({ source, size, style, duration = 4000, delay = 0, opacity = 0.85 }: FloatingBubbleProps) => {
  const floatAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [])

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -14],
  })

  return (
    <Animated.Image
      source={source}
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          opacity,
          transform: [{ translateY }],
        },
        style,
      ]}
      resizeMode="contain"
    />
  )
}

const index = () => {
  const router = useRouter()
  const [hasNavigated, setHasNavigated] = useState(false)

  const logoScale = useRef(new Animated.Value(0.6)).current
  const logoOpacity = useRef(new Animated.Value(0)).current
  const textOpacity = useRef(new Animated.Value(0)).current
  const textTranslateY = useRef(new Animated.Value(12)).current
  const buttonOpacity = useRef(new Animated.Value(0)).current
  const buttonTranslateY = useRef(new Animated.Value(12)).current
  const buttonScale = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(buttonTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start()
  }, [])

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start()
  }

  const goToLogin = () => {
    if (hasNavigated) return
    setHasNavigated(true)

    Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1.15,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.replace('/choice')
    })
  }

  return (
    <View style={styles.container}>
      {/* Soft blue gradient backdrop, like the WashWise reference */}
      <LinearGradient
        colors={['#BFE6FB', '#DFF3FD', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />
      

      {/* Scattered floating bubbles — mix of both bubble images, varied sizes/opacity so it reads as background, not foreground clutter */}
      <FloatingBubble
        source={require('../assets/img/bubble1.png')}
        size={70}
        style={{ top: height * 0.08, left: -20 }}
        duration={3800}
        opacity={0.55}
      />
      <FloatingBubble
        source={require('../assets/img/bubble2.png')}
        size={40}
        style={{ top: height * 0.05, right: 30 }}
        duration={3000}
        delay={200}
        opacity={0.5}
      />
      <FloatingBubble
        source={require('../assets/img/bubble2.png')}
        size={110}
        style={{ top: height * 0.18, right: -35 }}
        duration={4600}
        delay={400}
        opacity={0.45}
      />
      <FloatingBubble
        source={require('../assets/img/bubble1.png')}
        size={26}
        style={{ top: height * 0.32, left: 40 }}
        duration={2600}
        delay={600}
        opacity={0.6}
      />
      <FloatingBubble
        source={require('../assets/img/bubble2.png')}
        size={55}
        style={{ bottom: height * 0.28, left: -15 }}
        duration={4000}
        delay={100}
        opacity={0.5}
      />
      <FloatingBubble
        source={require('../assets/img/bubble1.png')}
        size={90}
        style={{ bottom: height * 0.16, right: -25 }}
        duration={5200}
        delay={300}
        opacity={0.4}
      />
      <FloatingBubble
        source={require('../assets/img/bubble2.png')}
        size={22}
        style={{ bottom: height * 0.38, right: 60 }}
        duration={2400}
        delay={500}
        opacity={0.65}
      />

      <Animated.View
        style={[
          styles.logoWrapper,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          source={require('../assets/img/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View
        style={{
          opacity: textOpacity,
          transform: [{ translateY: textTranslateY }],
        }}
      >
        <Text style={styles.tagline}>Clean Clothes,Hassle-Free</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.buttonWrapper,
          {
            opacity: buttonOpacity,
            transform: [{ translateY: buttonTranslateY }],
          },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.9}
            onPress={goToLogin}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <Text style={styles.primaryButtonText}>Get started</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  )
}

export default index

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoWrapper: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 180,
    height: 180,
  },
  tagline: {
    fontSize: 15,
    color: '#4B5A66',
    fontWeight: '500',
    marginBottom: 48,
    textAlign: 'center',
  },
  buttonWrapper: {
    position: 'absolute',
    bottom: 64,
    width: '100%',
    paddingHorizontal: 40,
  },
  primaryButton: {
    backgroundColor: '#68b5f5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#3A9BE0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
})