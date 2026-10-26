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
  setDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore'
import type { Deck } from '../models/deck'
import type {
  DeckMemorizationHistory,
  UserMemorizationHistory
} from '../models/memorizationHistory'

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

/**
 * Download and return a deck from firestore
 * @param deckId The id of the deck to retrieve
 * @returns The deck
 */
export const getDeck = async (deckId: string) => {
  // Todo better types because deck here (from firestore) does not fit the type description, it only fits it on the following line
  const deck = (await getDoc(doc(db, 'deck', deckId))).data()
  return {
    ...deck,
    id: deckId
  } as Deck
}

/**
 * Update the deck in parameter
 * @param deck The deck to update
 */
export const updateDeck = async (deck: Deck) => {
  if (!deck.id) {
    throw new Error('Deck has no id')
  }
  const deckRef = doc(db, 'deck', deck.id)
  const { id, ...deckData } = deck

  await updateDoc(deckRef, deckData)
}

/**
 * Saves a DeckMemorizationStatus in the db
 * @param userId the id for the user
 * @param deckId the id of the deck
 * @param statuses statuses for cards
 */
export async function saveDeckMemorizationHistory(
  userId: string,
  deckId: string,
  statuses: DeckMemorizationHistory
) {
  const deckRef = doc(db, 'memorization_history', userId, 'deck', deckId)

  await setDoc(deckRef, statuses)
}

/**
 * Loads a DeckMemorizationStatus in the db
 * @param userId the id for the user
 * @param deckId the id of the deck
 * @param statuses statuses for cards
 */
export async function getDeckMemorizationHistory(userId: string, deckId: string) {
  const deckRef = doc(db, 'memorization_history', userId, 'deck', deckId)

  const response = await getDoc(deckRef)
  if (!response.exists()) {
    return {}
  }
  return response.data() as DeckMemorizationHistory
}

/**
 * Loads a UserMemorizationHistory in the db
 * @param userId the id for the user
 * @param statuses statuses for learned cards in all 'touched' decks
 */
export async function getUserMemorizationHistory(userId: string) {
  const deckMemorizedRef = collection(db, 'memorization_history', userId, 'deck')

  const response = await getDocs(deckMemorizedRef)
  const res = Object.fromEntries(response.docs.map((d) => [d.id, d.data()]))
  return res as UserMemorizationHistory
}
