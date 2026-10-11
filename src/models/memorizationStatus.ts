import type { Timestamp } from 'firebase/firestore'

interface CardMemorizationStatus {
  successfulAttempts: Timestamp[]
}

export type DeckMemorizationStatus = Record<string, CardMemorizationStatus>
