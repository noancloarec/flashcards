import type { DeckMemorizationStatus, UserMemorizationStatus } from '../models/memorizationStatus'

/**
 * Loads a UserMemorizationStatus in the db
 * @param userId the id for the user
 * @param statuses statuses for learned cards in all 'touched' decks
 */
export function getUserMemorizationStatusFromLocalStorage() {
  const memorizationStatus = localStorage.getItem('user_memorization_status')
  if (!memorizationStatus) {
    return {}
  } else {
    return JSON.parse(memorizationStatus) as UserMemorizationStatus
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
