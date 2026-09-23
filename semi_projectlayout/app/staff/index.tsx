import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'

export default function StaffWelcome() {
  const router = useRouter()
  return <View style={styles.screen}><LinearGradient colors={['#BEE9FF', '#F7FCFF', '#FFFFFF']} style={StyleSheet.absoluteFill} />
    <Image source={require('../../assets/img/bubble1.png')} style={[styles.bubble, styles.leftBubble]} resizeMode="contain" />
    <Image source={require('../../assets/img/bubble2.png')} style={[styles.bubble, styles.rightBubble]} resizeMode="contain" />
    <View style={styles.content}><Image source={require('../../assets/img/logo.png')} style={styles.logo} resizeMode="contain" /><Text style={styles.brand}>WashWise</Text><Text style={styles.tagline}>Clean Clothes. Hassle-Free</Text></View>
    <Pressable onPress={() => router.push('/staff/login')} style={styles.button}><Text style={styles.buttonText}>Get Started</Text></Pressable>
  </View>
}

const styles = StyleSheet.create({ screen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }, bubble: { position: 'absolute', opacity: 0.4 }, leftBubble: { width: 80, height: 80, top: 20, left: -30 }, rightBubble: { width: 115, height: 115, bottom: 45, right: -45 }, content: { alignItems: 'center', marginTop: -25 }, logo: { width: 110, height: 88 }, brand: { color: '#075191', fontSize: 23, fontWeight: '800', marginTop: -8 }, tagline: { color: '#607D90', fontSize: 9, marginTop: 4 }, button: { position: 'absolute', left: 20, right: 20, bottom: 28, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: '#59B2F0' }, buttonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' } })