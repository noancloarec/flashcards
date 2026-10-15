import { Timestamp } from 'firebase/firestore'
import type { CardId } from './card'
import type { DeckId } from './deck'

export type ElementByCard<T> = {
  [cardId: CardId]: T
}

export type ElementByCardByDeck<T> = {
  [deckId: DeckId]: ElementByCard<T>
}

/**
 * When and how many times a user has remembered a Card
 */
export interface MemorizationHistory {
  successfulAttempts: Timestamp[] // Sorted descendingly (most recent is first)
}

export type DeckMemorizationHistory = ElementByCard<MemorizationHistory>

export type UserMemorizationHistory = ElementByCardByDeck<MemorizationHistory>
