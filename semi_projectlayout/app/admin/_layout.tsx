import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDocFromServer } from 'firebase/firestore'
import { Redirect, Stack, useSegments } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { auth, db } from '../../firebase/firebase'

type AccessState = 'checking' | 'allowed' | 'denied'

export default function AdminLayout() {
  const segments = useSegments()
  const currentRoute = segments[segments.length - 1]
  const publicRoute = currentRoute === 'index' || currentRoute === 'login'
  const [access, setAccess] = useState<AccessState>('checking')

  useEffect(() => {
    if (publicRoute) {
      setAccess('allowed')
      return
    }

    let active = true
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (active) setAccess('denied')
        return
      }

      try {
        const snapshot = await getDocFromServer(doc(db, 'staffAccounts', user.uid))
        const profile = snapshot.data()
        const isAdmin = profile?.staffId === user.uid
          && profile.role === 'admin'
          && profile.isActive === true
        if (active) setAccess(isAdmin ? 'allowed' : 'denied')
      } catch {
        if (active) setAccess('denied')
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [publicRoute])

  if (!publicRoute && access === 'checking') {
    return <View style={styles.loading}><ActivityIndicator size="small" color="#138FEC" /></View>
  }

  if (!publicRoute && access === 'denied') {
    return <Redirect href="/admin" />
  }

  return <Stack screenOptions={{ headerShown: false }} />
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E4F6FF',
  },
})