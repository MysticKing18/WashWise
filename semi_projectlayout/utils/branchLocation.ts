import { Linking } from 'react-native'
import { Branch } from '../database/models/Branch'

const branchImages = {
  Laundry1: require('../assets/img/Laundry1.png'),
  Laundry2: require('../assets/img/Laundry2.png'),
  Laundry3: require('../assets/img/Laundry3.png'),
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