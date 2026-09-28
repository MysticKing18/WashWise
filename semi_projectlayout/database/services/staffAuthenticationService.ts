import { signInWithEmailAndPassword, signOut, type User } from 'firebase/auth'
import { doc, getDocFromServer } from 'firebase/firestore'
import { auth, db } from '../../firebase/firebase'
import type { StaffAccount } from '../models/StaffAccount'

export class StaffLoginError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message)
    this.name = 'StaffLoginError'
  }
}

export async function getCurrentStaffProfile(): Promise<StaffAccount> {
  await auth.authStateReady()
  const user = auth.currentUser
  if (!user) throw new StaffLoginError('staff/unauthenticated', 'Sign in with a staff account to continue.')

  const snapshot = await getDocFromServer(doc(db, 'staffAccounts', user.uid))
  const profile = snapshot.data() as StaffAccount | undefined
  if (!profile || profile.role !== 'staff' || profile.staffId !== user.uid) {
    throw new StaffLoginError('staff/not-staff', 'This account does not have staff access. Please contact your administrator.')
  }
  if (profile.isActive !== true) {
    throw new StaffLoginError('staff/inactive', 'Your staff account is inactive. Please contact your administrator.')
  }
  if (typeof profile.branchId !== 'string' || !profile.branchId.trim()) {
    throw new StaffLoginError('staff/unassigned', 'Your account has no assigned branch. Please contact your administrator.')
  }
  return profile
}

/** Only a server-verified, active staff profile may enter the staff panel. */
export async function signInStaff(email: string, password: string): Promise<StaffAccount> {
  let signedInUser: User | undefined
  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
    signedInUser = credential.user
    const profile = await getCurrentStaffProfile()
    if (auth.currentUser?.uid !== signedInUser.uid) throw new StaffLoginError('staff/session-changed', 'Your sign-in session changed. Please try again.')
    return profile
  } catch (error) {
    // Invalid credentials must not sign out a pre-existing session. A successful
    // Auth login whose staff verification failed must not remain signed in.
    if (signedInUser && auth.currentUser?.uid === signedInUser.uid) {
      await signOut(auth)
    }
    throw error
  }
}
