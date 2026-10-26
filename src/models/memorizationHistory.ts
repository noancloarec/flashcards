import { Timestamp } from 'firebase/firestore'

import type { CardId } from './card'
import type { DeckId } from './deck'

export type ElementByCardId<T> = {
  [cardId: CardId]: T
}

export type ElementByDeckId<T> = {
  [deckId: DeckId]: T
}

/**
 * When and how many times a user has remembered a Card
 */
export interface MemorizationHistory {
  successfulAttempts: Timestamp[] // Sorted descendingly (most recent is first)
}

export type DeckMemorizationHistory = ElementByCardId<MemorizationHistory>

export type UserMemorizationHistory = ElementByDeckId<ElementByCardId<MemorizationHistory>>
