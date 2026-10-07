// src/composables/useAuth.ts
import { computed, ref } from 'vue'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User
} from 'firebase/auth'
import { auth } from '../services/firebase'

const user = ref<User | null>(null)
const loading = ref(true)

// Resolves once Firebase has restored (or not) the session
const authReady = new Promise<void>((resolve) => {
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser
    loading.value = false
    resolve()
  })
})

const provider = new GoogleAuthProvider()

export function useAuth() {
  return {
    user,
    loading,
    isLoggedIn: computed(() => user.value !== null),
    authReady,
    signIn: () => signInWithPopup(auth, provider),
    signOut: () => signOut(auth)
  }
}
