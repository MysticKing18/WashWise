import { Stack, useRootNavigationState } from 'expo-router'
import Head from 'expo-router/head'
import * as NavigationBar from 'expo-navigation-bar'
import * as SplashScreen from 'expo-splash-screen'
import { useCallback, useEffect, useState } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { StartupLoadingScreen } from '../components/StartupLoadingScreen'

// The native launch image hands over to the animated view once it has a layout.
if (Platform.OS !== 'web') {
	void SplashScreen.preventAutoHideAsync().catch(() => {})
}

export default function RootLayout() {
	const navigationState = useRootNavigationState()
	const [showLoadingScreen, setShowLoadingScreen] = useState(true)
	const [layoutReady, setLayoutReady] = useState(false)
	const finishLoading = useCallback(() => setShowLoadingScreen(false), [])
	const showAnimatedLoading = useCallback(() => {
		setLayoutReady(true)
		if (Platform.OS !== 'web') void SplashScreen.hideAsync().catch(() => {})
	}, [])

	useEffect(() => {
		if (Platform.OS !== 'android') return

		NavigationBar.setVisibilityAsync('hidden')
	}, [])

	return <View style={styles.root}>
		{Platform.OS === 'web' && <Head><title>WashWise</title></Head>}
		<View style={styles.root} accessibilityElementsHidden={showLoadingScreen} importantForAccessibility={showLoadingScreen ? 'no-hide-descendants' : 'auto'}>
			<Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 250 }} />
		</View>
		{showLoadingScreen && <StartupLoadingScreen
			ready={layoutReady && !!navigationState?.key}
			onLayout={showAnimatedLoading}
			onFinish={finishLoading}
		/>}
	</View>
}

const styles = StyleSheet.create({ root: { flex: 1 } })
