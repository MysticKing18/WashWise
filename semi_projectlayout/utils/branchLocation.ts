import { Linking } from 'react-native'
import { Branch } from '../database/models/Branch'

const branchImages = {
  Laundry1: require('../assets/img/Laundry1.png'),
  Laundry2: require('../assets/img/Laundry2.png'),
  Laundry3: require('../assets/img/Laundry3.png'),
  Laundry4: require('../assets/img/Laundry4.png'),
  Laundry5: require('../assets/img/Laundry5.png'),
} as const

export const getBranchImage = (branch: Branch) => {
  const imageKey = branch.photoUrl?.replace(/\.png$/i, '') as keyof typeof branchImages | undefined
  return imageKey && imageKey in branchImages
    ? branchImages[imageKey]
    : branchImages.Laundry1
}

export const openBranchMap = async (branch: Branch): Promise<void> => {
  const query = branch.location?.mapQuery || `${branch.name}, ${branch.address}`
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
  const canOpen = await Linking.canOpenURL(url)
  if (!canOpen) throw new Error('Maps link is unavailable')
  await Linking.openURL(url)
}

export const getDistanceInKilometers = (
  latitude: number,
  longitude: number,
  branch: Branch,
): number | null => {
  const branchLatitude = branch.location?.latitude
  const branchLongitude = branch.location?.longitude
  if (typeof branchLatitude !== 'number' || typeof branchLongitude !== 'number') return null

  const toRadians = (degrees: number) => degrees * (Math.PI / 180)
  const earthRadiusInKilometers = 6371
  const latitudeDifference = toRadians(branchLatitude - latitude)
  const longitudeDifference = toRadians(branchLongitude - longitude)
  const startLatitude = toRadians(latitude)
  const endLatitude = toRadians(branchLatitude)
  const haversine = Math.sin(latitudeDifference / 2) ** 2
    + Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDifference / 2) ** 2

  return 2 * earthRadiusInKilometers * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}