import { Timestamp } from 'firebase/firestore'
import { Branch } from './models/Branch'

const timestamp = Timestamp.now()

export const BRANCH_CATALOG: Branch[] = [
  {
    branchId: 'mr-bee-laundromat-services',
    name: 'Mr. Bee Laundromat & Services',
    address: 'Sobrecarey Street, Tagum City, Davao del Norte. CRR3+R2P',
    photoUrl: 'Laundry1.png',
    location: {
      city: 'Tagum City',
      province: 'Davao del Norte',
      landmark: 'CRR3+R2P',
      mapQuery: 'CRR3+R2P, Tagum City, Davao del Norte',
    },
    regularPrice: 50,
    rushPrice: 80,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    branchId: 'mums-laundry-lower-apokon',
    name: 'MUMS Laundry - Lower Apokon',
    address: 'Door 5 & 6, Cris Inn Hotel, Lower Apokon, Magugpo East, Tagum City, 8100',
    photoUrl: 'Laundry2.png',
    location: {
      city: 'Tagum City',
      province: 'Davao del Norte',
      barangay: 'Magugpo East',
      landmark: 'Cris Inn Hotel, Lower Apokon',
      mapQuery: 'MUMS Laundry, Cris Inn Hotel, Lower Apokon, Tagum City',
    },
    regularPrice: 50,
    rushPrice: 80,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    branchId: 'i-laba-u-narra',
    name: 'I Laba U Narra',
    address: 'Racho Store, Purok Narra, behind Robinsons Mall, Tagum City, Davao del Norte, 8100',
    photoUrl: 'Laundry3.png',
    location: {
      city: 'Tagum City',
      province: 'Davao del Norte',
      barangay: 'Purok Narra',
      landmark: 'Racho Store, behind Robinsons Mall',
      mapQuery: 'I Laba U Narra, Purok Narra, Tagum City',
    },
    regularPrice: 50,
    rushPrice: 80,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
]