import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBHPBl6MD-7vbGIkoyWwQZsE0GH1AOS3cM',
  authDomain: 'flashcards-c1e39.firebaseapp.com',
  projectId: 'flashcards-c1e39',
  storageBucket: 'flashcards-c1e39.appspot.com',
  messagingSenderId: '289841998090',
  appId: '1:289841998090:web:630464da121449e2d872f3'
}

const app = initializeApp(firebaseConfig)

/**
 * Initialises the firestore db
 */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
})

/**
 * Provides the Firebase auth service
 */
export const auth = getAuth(app)
