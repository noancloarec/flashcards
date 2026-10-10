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
import type { Card } from '../models/card'

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
  batch.set(targetRef, snapshot.data)
  batch.delete(sourceRef)
  await batch.commit()
}

/**
 * Archive a deck
 * @param deckId Deck to archive
 */
export const archiveDeck = async (deckId: string) => moveDeck(deckId, 'deck', 'archived_deck')

/**
 * Unarchive a deck
 * @param deckId Deck to unarchive
 */
export const unArchiveDeck = async (deckId: string) => moveDeck(deckId, 'archived_deck', 'deck')

/**
 * Converts the formatting that has been done in json (bold and newline) to html
 * @param str the string to format
 * @returns the html version
 */
const jsonToHtml = (str: string) =>
  str
    .replaceAll(/\*.*\*/g, (s) => `<em>${s.substring(1, s.length - 1)}</em>`)
    .replaceAll('\n', '</br>')

/**
 * Map a card from firestore to its expected format in the app
 * @param card the card from firestore
 * @returns the card ready to use by the app
 */
const mapCardFromFirestore = (card: any) =>
  ({
    question: jsonToHtml(card.question),
    answer: jsonToHtml(card.answer),
    successfulAttempts: [],
    failedAttempts: [],
    id: card.id
  }) as Card

/**
 * Download and return a deck from firestore
 * @param deckId The id of the deck to retrieve
 * @returns The deck
 */
export const getDeck = async (deckId: string) => {
  // Todo better types because deck here (from firestore) does not fit the type description, it only fits it on the following line
  const deck = (await getDoc(doc(db, 'deck', deckId))).data() as Deck
  return {
    ...deck,
    cards: deck.cards.map(mapCardFromFirestore)
  } as Deck
}
