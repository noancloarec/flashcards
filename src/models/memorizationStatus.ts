import type { Timestamp } from 'firebase/firestore'

export interface CardMemorizationStatus {
  successfulAttempts: Timestamp[]
}

type CardId = string

export type DeckMemorizationStatus = Record<CardId, CardMemorizationStatus>

type DeckId = string
export type UserMemorizationStatus = Record<DeckId, DeckMemorizationStatus>
