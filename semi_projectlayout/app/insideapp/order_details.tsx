import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BRANCH_CATALOG } from '../../database/branchCatalog'
import { getBranchImage } from '../../utils/branchLocation'

export default function OrderDetails() {
	const router = useRouter()
	const { branchId } = useLocalSearchParams<{ branchId?: string }>()
	const branch = BRANCH_CATALOG.find((item) => item.branchId === branchId) || BRANCH_CATALOG[0]
	const displayName = branch.branchId === 'mr-bee-laundromat-services' ? 'Main Branch' : branch.name
	const mapQuery = branch.location?.mapQuery || `${branch.name}, ${branch.address}`

	const handleBack = () => {
		router.replace('/insideapp/home')
	}

	const openMap = async () => {
		const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`
		if (await Linking.canOpenURL(url)) await Linking.openURL(url)
	}

	return (
		<View style={styles.screen}>
			<StatusBar style="dark" />
			<LinearGradient colors={['#C8EAFB', '#F4FAFE', '#E3F4FF']} style={StyleSheet.absoluteFill} />
			<SafeAreaView style={styles.safeArea}>
				<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
					<View style={styles.topBar}>
						<Pressable accessibilityRole="button" accessibilityLabel="Go back to home" onPress={handleBack} style={styles.backButton}>
							<Ionicons name="arrow-back" size={21} color="#0877C8" />
						</Pressable>
						<Text style={styles.title}>Branch Details</Text>
						<View style={styles.topSpacer} />
					</View>

					<View style={styles.heroWrap}>
						<Image source={getBranchImage(branch)} resizeMode="cover" style={styles.heroImage} />
						<View style={styles.mainBadge}><Text style={styles.mainBadgeText}>{displayName}</Text></View>
					</View>

					<View style={styles.infoCard}>
						<Text style={styles.branchName}>{branch.branchId === 'mr-bee-laundromat-services' ? 'WashWise - Main Branch' : branch.name}</Text>
						<View style={styles.addressRow}>
							<Ionicons name="location-outline" size={17} color="#0877C8" />
							<Text style={styles.address}>{branch.address}</Text>
						</View>
					</View>

					<Text style={styles.sectionLabel}>Location</Text>
					<View style={styles.mapCard}>
						<View style={styles.mapPlaceholder}>
							<Ionicons name="map-outline" size={34} color="#78A9C7" />
							<Text style={styles.mapLabel}>{branch.location?.landmark || 'Tagum City'}</Text>
						</View>
						<Pressable accessibilityRole="button" onPress={() => void openMap()} style={styles.mapButton}>
							<Ionicons name="location-outline" size={14} color="#0877C8" />
							<Text style={styles.mapButtonText}>View on Map</Text>
						</Pressable>
					</View>

					<Text style={styles.sectionLabel}>Pricing</Text>
					<View style={styles.pricingRow}>
						<View style={styles.priceCard}>
							<Ionicons name="sync-circle-outline" size={25} color="#0877C8" />
							  <View><Text style={styles.priceCaption}>Regular</Text><Text style={styles.price}>₱{branch.regularPrice}/ kg</Text></View>
						</View>
						<View style={styles.priceCard}>
							<Ionicons name="flash" size={23} color="#0877C8" />
							  <View><Text style={styles.priceCaption}>Rush</Text><Text style={styles.price}>₱{branch.rushPrice}/ kg</Text></View>
						</View>
					</View>

					<Pressable
						accessibilityRole="button"
						accessibilityLabel={`Order from ${displayName}`}
						onPress={() => router.push({ pathname: '/insideapp/order_choice', params: { branchId: branch.branchId } })}
						style={({ pressed }) => [styles.orderButton, pressed && styles.pressed]}
					>
						<Ionicons name="cart-outline" size={18} color="#FFFFFF" />
						<Text style={styles.orderButtonText}>Order from this Branch</Text>
					</Pressable>
				</ScrollView>
			</SafeAreaView>
		</View>
	)
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: '#E3F4FF' },
	safeArea: { flex: 1 },
	content: { width: '100%', maxWidth: 420, alignSelf: 'center', paddingHorizontal: 10, paddingBottom: 24 },
	topBar: { height: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
	backButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
	topSpacer: { width: 30 },
	title: { flex: 1, textAlign: 'left', fontSize: 14, fontWeight: '700', color: '#075191' },
	heroWrap: { height: 142, borderRadius: 8, overflow: 'hidden', backgroundColor: '#D5E8F3' },
	heroImage: { width: '100%', height: '100%' },
	mainBadge: { position: 'absolute', top: 8, right: 8, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#0877C8' },
	mainBadgeText: { color: '#FFFFFF', fontSize: 8, fontWeight: '700' },
	infoCard: { marginTop: 5, padding: 9, borderRadius: 7, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD8E0' },
	branchName: { color: '#075191', fontSize: 14, fontWeight: '800', marginBottom: 6 },
	addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5 },
	address: { flex: 1, color: '#5F6B7A', fontSize: 9, lineHeight: 13 },
	sectionLabel: { marginTop: 8, marginBottom: 4, color: '#075191', fontSize: 10, fontWeight: '700' },
	mapCard: { padding: 4, borderRadius: 7, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD8E0' },
	mapPlaceholder: { height: 70, alignItems: 'center', justifyContent: 'center', borderRadius: 5, backgroundColor: '#DDEAF0' },
	mapLabel: { marginTop: 3, color: '#648092', fontSize: 8 },
	mapButton: { height: 22, marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 4, borderWidth: 1, borderColor: '#5FAEFF' },
	mapButtonText: { color: '#0877C8', fontSize: 8, fontWeight: '700' },
	pricingRow: { flexDirection: 'row', gap: 6 },
	priceCard: { flex: 1, minHeight: 49, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 7, borderRadius: 6, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD8E0' },
	priceCaption: { color: '#5F6B7A', fontSize: 7 },
	price: { color: '#075191', fontSize: 12, fontWeight: '800' },
	orderButton: { height: 34, marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 5, backgroundColor: '#0877D1' },
	orderButtonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
	pressed: { opacity: 0.75 },
})
