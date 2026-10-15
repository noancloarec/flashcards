import { Timestamp } from 'firebase/firestore'
import type {
  DeckMemorizationHistory,
  ElementByCardByDeck,
  UserMemorizationHistory
} from '../models/memorizationHistory'
import { mapValues } from './basicOperations'

type FirestoreTimestampNotParsed = {
  type: 'firestore/timestamp/1.0'
  seconds: number
  nanoseconds: number
}

interface AttemptHistoryInLocalStorage {
  successfulAttempts: FirestoreTimestampNotParsed[]
}

type UserMemorizationStatusInLocalStorage = ElementByCardByDeck<AttemptHistoryInLocalStorage>

/**
 * Loads a UserMemorizationStatus in the db
 * @param userId the id for the user
 * @param statuses statuses for learned cards in all 'touched' decks
 */
export const getUserMemorizationStatusFromLocalStorage: () => UserMemorizationHistory = () => {
  const memorizationStatus = localStorage.getItem('user_memorization_history')
  if (!memorizationStatus) {
    return {}
  } else {
    const userMemorization: UserMemorizationStatusInLocalStorage = JSON.parse(memorizationStatus)

    return mapValues(userMemorization, (deckMemorizationStatus) =>
      mapValues(deckMemorizationStatus, (cardMemorizationStatus) => ({
        successfulAttempts: cardMemorizationStatus.successfulAttempts.map((timeStampNotParsed) =>
          Timestamp.fromJSON(timeStampNotParsed)
        )
      }))
    )
  }
}

/**
 * Loads a DeckMemorizationStatus from the local storage
 * @param deckId the id of the deck
 */
export const getDeckMemorizationStatusFromLocalStorage: (
  deckId: string
) => DeckMemorizationHistory = (deckId) => {
  const deckMemorisationStatus = getUserMemorizationStatusFromLocalStorage()[deckId]
  if (!deckMemorisationStatus) {
    return {}
  } else {
    return deckMemorisationStatus
  }
}

/**
 * Saves a DeckMemorizationStatus in the db
 * @param deckId the id of the deck
 * @param memorizationHistory history of attempts for the deck
 */
export function saveDeckMemorizationStatusToLocalStorage(
  deckId: string,
  memorizationHistory: DeckMemorizationHistory
) {
  const userMemorizationStatus: UserMemorizationHistory =
    getUserMemorizationStatusFromLocalStorage()
  userMemorizationStatus[deckId] = memorizationHistory
  localStorage.setItem('user_memorization_history', JSON.stringify(userMemorizationStatus))
}
