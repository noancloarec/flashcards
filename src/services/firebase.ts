import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  initializeFirestore,
  orderBy,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  writeBatch
} from 'firebase/firestore'
import type { Deck } from '../models/deck'

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

/**
 * Download all decks from firestore
 * @returns All decks
 */
export const getDeckList = async () => {
  const deckRef = collection(db, 'deck')
  const decks = await getDocs(query(deckRef, orderBy('createdAt')))

  return decks.docs.map(
    (d) =>
      ({
        id: d.id,
        ...d.data()
      }) as Deck
  )
}

/**
 * Move a deck from a collection to another
 */
const moveDeck = async (deckId: string, sourceCollection: string, targetCollection: string) => {
  const sourceRef = doc(db, sourceCollection, deckId)
  const targetRef = doc(db, targetCollection, deckId)
  const batch = writeBatch(db)
  const snapshot = await getDoc(sourceRef)
  if (!snapshot.exists()) {
    throw new Error(`Deck not found in ${sourceCollection} : ${deckId}`)
  }
  batch.set(targetRef, snapshot.data())
  batch.delete(sourceRef)
  await batch.commit()
}

/**
 * Archive a deck
 * @param deckId Deck to archive
 */
export const archiveDeck = (deckId: string) => moveDeck(deckId, 'deck', 'archived_deck')

/**
 * Unarchive a deck
 * @param deckId Deck to unarchive
 */
export const unArchiveDeck = (deckId: string) => moveDeck(deckId, 'archived_deck', 'deck')
