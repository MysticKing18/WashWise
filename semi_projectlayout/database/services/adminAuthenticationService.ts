import { signInWithEmailAndPassword, signOut, type User } from 'firebase/auth'
import { doc, getDocFromServer } from 'firebase/firestore'
import { auth, db } from '../../firebase/firebase'

export class AdminLoginError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message)
    this.name = 'AdminLoginError'
  }
}

export async function signInAdmin(email: string, password: string): Promise<void> {
  let signedInUser: User | undefined
  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
    signedInUser = credential.user
    const snapshot = await getDocFromServer(doc(db, 'staffAccounts', signedInUser.uid))
    const profile = snapshot.data()
    if (!snapshot.exists()) {
      throw new AdminLoginError('admin/not-configured', 'No staffAccounts document exists for this signed-in account UID.')
    }
    if (profile?.staffId !== signedInUser.uid) {
      throw new AdminLoginError('admin/profile-mismatch', 'The staffId field must exactly match the signed-in account UID.')
    }
    if (profile.role !== 'admin') {
      throw new AdminLoginError('admin/not-admin', 'The staffAccounts role field must be exactly admin.')
    }
    if (profile.isActive !== true) {
      throw new AdminLoginError('admin/inactive', 'This administrator account is inactive. Contact the project owner.')
    }
    if (auth.currentUser?.uid !== signedInUser.uid) {
      throw new AdminLoginError('admin/session-changed', 'Your sign-in session changed. Please try again.')
    }
  } catch (error) {
    if (signedInUser && auth.currentUser?.uid === signedInUser.uid) await signOut(auth)
    throw error
  }
}
