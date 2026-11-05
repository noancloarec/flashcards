import { Timestamp } from 'firebase/firestore'

import type {
  DeckMemorizationHistory,
  ElementByCardId,
  ElementByDeckId,
  UserMemorizationHistory
} from '../models/memorizationHistory'
import { mapValues } from './javascriptMissingFunctions'
import type { DeckId } from '../models/deck'

type FirestoreTimestampNotParsed = {
  type: 'firestore/timestamp/1.0'
  seconds: number
  nanoseconds: number
}

interface AttemptHistoryInLocalStorage {
  successfulAttempts: FirestoreTimestampNotParsed[]
}

type UserMemorizationHistoryInLocalStorage = ElementByDeckId<
  ElementByCardId<AttemptHistoryInLocalStorage>
>

/**
 * Loads a UserMemorizationHistoryInLocalStorage from the db
 * @param userId the id for the user
 * @param statuses statuses for learned cards in all 'touched' decks
 */
export const getUserMemorizationHistoryFromLocalStorage: () => UserMemorizationHistory = () => {
  const memorizationStatus = localStorage.getItem('user_memorization_history')
  if (!memorizationStatus) {
    return {}
  } else {
    const userMemorization: UserMemorizationHistoryInLocalStorage = JSON.parse(memorizationStatus)

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
export const getDeckMemorizationHistoryFromLocalStorage: (
  deckId: string
) => DeckMemorizationHistory = (deckId) => {
  const deckMemorisationStatus = getUserMemorizationHistoryFromLocalStorage()[deckId]
  if (!deckMemorisationStatus) {
    return {}
  } else {
    return deckMemorisationStatus
  }
}

/**
 * Saves a DeckMemorizationHistory in the db
 * @param deckId the id of the deck
 * @param memorizationHistory history of attempts for the deck
 */
export function saveDeckMemorizationHistoryToLocalStorage(
  deckId: string,
  memorizationHistory: DeckMemorizationHistory
) {
  const userMemorizationStatus: UserMemorizationHistory =
    getUserMemorizationHistoryFromLocalStorage()
  userMemorizationStatus[deckId] = memorizationHistory
  localStorage.setItem('user_memorization_history', JSON.stringify(userMemorizationStatus))
}

/**
 * Retrieves last time each deck has been (partially) learnt
 * Used to sort decks on the homepage to display decks currently being learnt
 * The information can also be found in the memorizationHistory on firestore, basing the sort on these data adds too much complexity
 * @returns Last time each deck has been (partially) learnt
 */
export const getDecksLatestMemorization: () => ElementByDeckId<number> = () => {
  const decksTouchedDate = localStorage.getItem('DecksLatestMemorization')
  if (!decksTouchedDate) {
    return {}
  }
  return JSON.parse(decksTouchedDate)
}

/**
 * Register the time at which a deck as partially learnt
 * @param id the deck that has been partially learnt
 */
export const registerDeckMemorization = (id: DeckId) => {
  const decksLatestMemorization = getDecksLatestMemorization()
  decksLatestMemorization[id] = new Date().getTime()

  localStorage.setItem('DecksLatestMemorization', JSON.stringify(decksLatestMemorization))
}
