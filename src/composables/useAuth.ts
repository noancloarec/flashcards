import { computed, ref } from 'vue'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User
} from 'firebase/auth'
import { auth } from '../services/firebase'

const googleUser = ref<User | null>(null)
const loading = ref(true)

// Resolves once Firebase has restored (or not) the session
const authReady = new Promise<void>((resolve) => {
  onAuthStateChanged(auth, (currentUser) => {
    googleUser.value = currentUser
    loading.value = false
    resolve()
  })
})

/**
 * UserId defaulting to the email address of the user, that falls back to a random uuid persisted in local storage
 * Used to store their data in firestore, , so they can retrieve
 * @returns The user id to be used in firestore to store their data
 */
const getUserId = async () => {
  await authReady
  if (googleUser.value?.email) {
    return googleUser.value.email
  } else {
    let id = localStorage.getItem('user-id')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('user-id', id)
    }
    return id
  }
}

const provider = new GoogleAuthProvider()

export function useAuth() {
  return {
    googleUser,
    loading,
    getUserId,
    isLoggedInGoogle: computed(() => googleUser.value !== null),
    authReady,
    signIn: () => signInWithPopup(auth, provider),
    signOut: () => signOut(auth)
  }
}
