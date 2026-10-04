import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useMemo, useState } from 'react'
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Branch } from '../../database/models/Branch'
import { subscribeToBranches } from '../../database/services/branchService'
import { getBranchImage } from '../../utils/branchLocation'

type BranchCardProps = {
  branch: Branch
  onSelect: () => void
  popular?: boolean
}

function BranchCard({ branch, onSelect, popular = false }: BranchCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Select ${branch.name}. ${branch.address}`}
      accessibilityHint="Opens a new order for this branch."
      onPress={onSelect}
      style={({ pressed }) => [styles.branchCard, pressed && styles.pressed]}
    >
      <View style={styles.selectBranch}>
        <View style={styles.branchPhotoWrap}>
          <Image source={getBranchImage(branch)} resizeMode="cover" style={styles.branchPhoto} />
        </View>

        <View style={styles.branchInfo}>
          <View style={styles.branchTitleRow}>
            <Text style={styles.branchName}>{branch.name}</Text>
            {popular && <View style={styles.popularBadge}><Text style={styles.popularText}>Popular</Text></View>}
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color="#5F6B7A" />
            <Text style={styles.branchAddress} numberOfLines={3}>{branch.address}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="business-outline" size={12} color="#5F6B7A" />
            <Text style={styles.metaText}>{branch.location?.landmark || 'Laundry services'}</Text>
            <View style={styles.openDot} />
            <Text style={styles.openText}>Open</Text>
          </View>
        </View>
        <Ionicons name="arrow-forward" size={20} color="#111111" />
      </View>
    </Pressable>
  )
}

export default function Branches() {
  const router = useRouter()
  const [branches, setBranches] = useState<Branch[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    setLoading(true)
    setLoadError(false)
    return subscribeToBranches(
      (savedBranches) => {
        setBranches(savedBranches)
        setLoadError(false)
        setLoading(false)
      },
      () => {
        setLoadError(true)
        setLoading(false)
      },
    )
  }, [retryCount])

  const filteredBranches = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    if (!query) return branches
    return branches.filter((branch) => [
      branch.name,
      branch.address,
      branch.location?.city,
      branch.location?.province,
      branch.location?.barangay,
      branch.location?.landmark,
    ].filter(Boolean).join(' ').toLocaleLowerCase().includes(query))
  }, [branches, search])

  const handleBack = () => {
    router.replace('/insideapp/home')
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <LinearGradient colors={['#C8EAFB', '#F4FAFE', '#E3F4FF']} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
        <Image source={require('../../assets/img/bubble1.png')} style={[styles.bubble, styles.topBubble]} resizeMode="contain" />
        <Image source={require('../../assets/img/bubble2.png')} style={[styles.bubble, styles.rightBubble]} resizeMode="contain" />
        <Image source={require('../../assets/img/bubble2.png')} style={[styles.bubble, styles.bottomBubble]} resizeMode="contain" />
      </View>

      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={handleBack} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <Ionicons name="arrow-back" size={22} color="#0877C8" />
            </Pressable>
            <Text accessibilityRole="header" style={styles.title}>Choose a Branch</Text>
            <View style={styles.topBarSpacer} />
          </View>

          <Text style={styles.subtitle}>Select the most convenient location for you</Text>

          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={22} color="#688399" />
            <TextInput
              accessibilityLabel="Search branches by name or location"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
              placeholder="Search branch..."
              placeholderTextColor="#748C9D"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {!!search && (
              <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setSearch('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="#748C9D" />
              </Pressable>
            )}
          </View>

          {loading ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>Finding your branches…</Text>
              <Text style={styles.stateMessage}>Getting the latest store information.</Text>
            </View>
          ) : loadError ? (
            <View style={styles.stateCard} accessibilityRole="alert">
              <Ionicons name="cloud-offline-outline" size={38} color="#688399" />
              <Text style={styles.stateTitle}>Couldn’t load branches</Text>
              <Text style={styles.stateMessage}>Check your connection and try again.</Text>
              <Pressable accessibilityRole="button" onPress={() => setRetryCount((count) => count + 1)} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
                <Text style={styles.retryLabel}>Try again</Text>
              </Pressable>
            </View>
          ) : filteredBranches.length === 0 ? (
            <View style={styles.stateCard}>
              <Ionicons name={branches.length ? 'search-outline' : 'storefront-outline'} size={38} color="#688399" />
              <Text style={styles.stateTitle}>{branches.length ? 'No matching stores' : 'No branches available yet'}</Text>
              <Text style={styles.stateMessage}>
                {branches.length ? 'Try another store name, street, or landmark.' : 'Store locations will appear here when they are available.'}
              </Text>
              {!!search && (
                <Pressable accessibilityRole="button" onPress={() => setSearch('')} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
                  <Text style={styles.retryLabel}>Clear search</Text>
                </Pressable>
              )}
            </View>
          ) : (
            filteredBranches.map((branch) => (
              <BranchCard
                key={branch.branchId}
                branch={branch}
                onSelect={() => router.push({ pathname: '/insideapp/order_details', params: { branchId: branch.branchId } })}
                popular={filteredBranches.indexOf(branch) === 0}
              />
            ))
          )}

          {!loading && !loadError && branches.length > 0 && (
            <View style={styles.helpRow}>
              <Ionicons name="information-circle-outline" size={17} color="#688399" />
              <Text style={styles.helpText}>Select a store to start your order. Staff will confirm the final weight and price at drop-off.</Text>
            </View>
          )}
        </ScrollView>

        <SafeAreaView edges={['bottom']} style={styles.navSafeArea}>
          <View style={styles.bottomNav}>
            <Pressable accessibilityRole="button" accessibilityLabel="Home" style={styles.navItem} onPress={() => router.replace('/insideapp/home')}>
              <Ionicons name="home" size={24} color="#64748B" />
              <Text style={styles.navLabel}>Home</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Orders" style={styles.navItem} onPress={() => router.replace('/insideapp/order')}>
              <Ionicons name="receipt-outline" size={24} color="#64748B" />
              <Text style={styles.navLabel}>Order</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Branches" accessibilityState={{ selected: true }} style={styles.navItem}>
              <Ionicons name="git-network-outline" size={24} color="#2563EB" />
              <Text style={[styles.navLabel, styles.activeNavLabel]}>Branches</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Profile" style={styles.navItem} onPress={() => router.replace('/insideapp/profile')}>
              <Ionicons name="person-circle-outline" size={25} color="#64748B" />
              <Text style={styles.navLabel}>Profile</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#E3F4FF',
  },

  safeArea: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 16,
  },

  bubble: {
    position: 'absolute',
    opacity: 0.35,
  },

  topBubble: {
    width: 80,
    height: 80,
    top: 20,
    left: -38,
  },

  rightBubble: {
    width: 130,
    height: 130,
    top: 90,
    right: -46,
  },

  bottomBubble: {
    width: 145,
    height: 145,
    bottom: 74,
    left: -55,
  },

  topBar: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C5DDEB',
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  topBarSpacer: {
    width: 44,
  },

  title: {
    flex: 1,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    color: '#075191',
    textAlign: 'left',
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: '#5F6B7A',
    marginTop: 4,
    marginBottom: 16,
  },

  searchBox: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C5D8E5',
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.94)',
    marginBottom: 6,
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
    fontSize: 14,
    lineHeight: 20,
    color: '#173D5A',
    paddingVertical: 10,
  },

  clearButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  branchCard: {
    minHeight: 102,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D2DCE3',
    shadowColor: '#756b98',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },

  selectBranch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  branchPhotoWrap: {
    width: 82,
    height: 78,
    overflow: 'hidden',
    borderRadius: 7,
    backgroundColor: '#D5E8F3',
  },

  branchPhoto: {
    width: '100%',
    height: '100%',
  },

  branchInfo: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 9,
  },

  branchTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },

  branchName: {
    flex: 1,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    color: '#075191',
  },

  popularBadge: {
    borderRadius: 6,
    backgroundColor: '#536CFF',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },

  popularText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
  },

  branchAddress: {
    flex: 1,
    fontSize: 10,
    lineHeight: 14,
    color: '#5F6B7A',
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },

  metaText: {
    flexShrink: 1,
    fontSize: 9,
    lineHeight: 13,
    color: '#5F6B7A',
  },

  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1CA65C',
    marginLeft: 2,
  },

  openText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1CA65C',
  },

  stateCard: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 25,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#D8EAF5',
  },

  stateTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
    color: '#244D6A',
    marginTop: 14,
    textAlign: 'center',
  },

  stateMessage: {
    fontSize: 13,
    lineHeight: 20,
    color: '#688399',
    marginTop: 6,
    textAlign: 'center',
  },

  retryButton: {
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: '#0877C8',
    paddingHorizontal: 22,
    borderRadius: 12,
    marginTop: 18,
  },

  retryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  helpRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    paddingHorizontal: 4,
    marginTop: 1,
  },

  helpText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#688399',
  },

  navSafeArea: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopWidth: 1,
    borderTopColor: '#D8EAF5',
  },

  bottomNav: {
    minHeight: 58,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 4,
    paddingBottom: 3,
  },

  navItem: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },

  activeNavIcon: {
    width: 46,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#E7F5FE',
  },

  navLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 3,
  },

  activeNavLabel: {
    color: '#2563EB',
    fontWeight: '700',
  },

  pressed: {
    opacity: 0.72,
  },
})
