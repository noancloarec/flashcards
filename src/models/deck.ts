import type { Card } from '../models/card'

export interface Deck {
  id: string
  name: string
  author: string
  cards: Card[]
}
