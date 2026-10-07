import type { Card } from '../models/card'

export interface DeckWithoutId {
  name: string
  author: string
  cards: Card[]
}

export interface Deck extends DeckWithoutId {
  id: string
}
