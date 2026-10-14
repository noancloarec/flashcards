import { Timestamp } from 'firebase/firestore'
import type {
  CardId,
  DeckId,
  DeckMemorizationStatus,
  UserMemorizationStatus
} from '../models/memorization'

type FirestoreTimestampNotParsed = {
  type: 'firestore/timestamp/1.0'
  seconds: number
  nanoseconds: number
}

type UserMemorizationStatusInLocalStorage = {
  [key: DeckId]: {
    [key: CardId]: {
      successfulAttempts: FirestoreTimestampNotParsed[]
    }
  }
}
const mapValues = <K extends string, V, R>(obj: Record<K, V>, fn: (value: V) => R): Record<K, R> =>
  Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, fn(value as V)])) as Record<
    K,
    R
  >

/**
 * Loads a UserMemorizationStatus in the db
 * @param userId the id for the user
 * @param statuses statuses for learned cards in all 'touched' decks
 */
export const getUserMemorizationStatusFromLocalStorage: () => UserMemorizationStatus = () => {
  const memorizationStatus = localStorage.getItem('user_memorization_status')
  if (!memorizationStatus) {
    return {}
  } else {
    const res: UserMemorizationStatusInLocalStorage = JSON.parse(memorizationStatus)

    return mapValues(res, (deckMemorizationStations) =>
      mapValues(deckMemorizationStations, (cardMemorizationStatus) => ({
        successfulAttempts: cardMemorizationStatus.successfulAttempts.map((timeStampNotParsed) =>
          Timestamp.fromJSON(timeStampNotParsed)
        )
      }))
    )
  }
}

/**
 * Loads a DeckMemorizationStatus from the local storage
 * @param userId the id for the user
 * @param deckId the id of the deck
 * @param statuses statuses for cards
 */
export function getDeckMemorizationStatusFromLocalStorage(deckId: string) {
  const deckMemorisationStatus = getUserMemorizationStatusFromLocalStorage()[deckId]
  if (!deckMemorisationStatus) {
    return {}
  } else {
    return deckMemorisationStatus as DeckMemorizationStatus
  }
}

/**
 * Saves a DeckMemorizationStatus in the db
 * @param deckId the id of the deck
 * @param statuses statuses for cards
 */
export function saveDeckMemorizationStatusToLocalStorage(
  deckId: string,
  statuses: DeckMemorizationStatus
) {
  const userMemorizationStatus: UserMemorizationStatus = getUserMemorizationStatusFromLocalStorage()
  userMemorizationStatus[deckId] = statuses
  localStorage.setItem('user_memorization_status', JSON.stringify(userMemorizationStatus))
}
