import type { Timestamp } from 'firebase/firestore'
import type { Card } from '../models/card'

export interface FunctionalDeck {
  name: string
  author: string
  cards: Card[]
}

export interface Deck extends FunctionalDeck {
  id: string
  createdAt: Timestamp
}
