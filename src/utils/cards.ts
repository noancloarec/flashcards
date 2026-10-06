import { initializeApp } from 'firebase/app'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore'
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

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
})

export enum CardState {
  Learned = 'learned',
  Notlearned = 'notlearned',
  NotTriedYet = 'notTriedYet'
}

export const getCardState = (card: Card): CardState => {
  if (!card.successfulAttempts.length && !card.failedAttempts.length) {
    return CardState.NotTriedYet
  } else if (
    !card.successfulAttempts.length ||
    card.failedAttempts[0] > card.successfulAttempts[0]
  ) {
    return CardState.Notlearned
  } else {
    return CardState.Learned
  }
}
