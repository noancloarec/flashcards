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

const provider = new GoogleAuthProvider()

export function useAuth() {
  return {
    googleUser,
    loading,
    isLoggedInGoogle: computed(() => googleUser.value !== null),
    authReady,
    signIn: () => signInWithPopup(auth, provider),
    signOut: () => signOut(auth)
  }
}
