import { Timestamp } from 'firebase/firestore'

import type { Deck } from './deck'
import {
  type DeckMemorizationHistory,
  type ElementByCardId,
  type ElementByDeckId,
  type MemorizationHistory,
  type UserMemorizationHistory
} from './memorizationHistory'

/**
 * The state of a card to display in the app
 */
export enum CardState {
  Learned = 'learned',
  Notlearned = 'notlearned',
  NotTriedYet = 'notTriedYet',
  ToLearnAgain = 'ToLearnAgain'
}

/**
 * The status of a card
 */
export interface CardMemorizationStatus {
  /** How much the user has remembered the card */
  level: number

  /** When the next level is reachable (past or future) */
  nextLevelAvailabilityDate: Timestamp

  /** Depends on the level and the nextLevelAvailabilityDate  */
  state: CardState
}

export interface DeckMemorizationStatus {
  latestMemorization: Timestamp | undefined
  cardsMemorization: ElementByCardId<CardMemorizationStatus>
}

/**
 * Determines the memorization status for a deck given its history
 * @param deck the deck whose memorization status must be determined
 * @param deckMemorizationHistory its memorization history, i.e. the memorization history for each card
 * @returns the deck memorization status, to be used in the components
 */
export const getDeckMemorizationStatus: (
  deck: Deck,
  deckMemorizationHistory: DeckMemorizationHistory | undefined
) => DeckMemorizationStatus = (deck, deckMemorizationHistory) => {
  if (deckMemorizationHistory === undefined) {
    return { cardsMemorization: {}, latestMemorization: undefined }
  }

  const cardsLatestMemorization = Object.values(deckMemorizationHistory).map(
    (cardMemorizationHistory) => cardMemorizationHistory.successfulAttempts[0].toMillis()
  )
  const latestMemorization = cardsLatestMemorization.length
    ? Timestamp.fromMillis(Math.max(...cardsLatestMemorization))
    : undefined

  const cardsMemorization = Object.fromEntries(
    deck.cards.map((card) => [
      card.id,
      getCardMemorizationStatus(deckMemorizationHistory?.[card.id])
    ])
  )
  return { latestMemorization, cardsMemorization }
}

export type UserMemorizationStatus = ElementByDeckId<DeckMemorizationStatus>

export const getUserMemorizationStatus: (
  decks: Deck[],
  userMemorizationHistory: UserMemorizationHistory
) => UserMemorizationStatus = (decks, userMemorizationHistory) =>
  Object.fromEntries(
    decks.map((deck) => [
      deck.id,
      getDeckMemorizationStatus(deck, userMemorizationHistory[deck.id])
    ])
  )

interface CardMemorizationSpan {
  daysToUnlock: number
}

const dayInMillis = 24 * 60 * 60 * 1000

const cardMemorizationLevels: CardMemorizationSpan[] = [
  { daysToUnlock: 0 }, // Level 1 reached right after the card has been remembered
  { daysToUnlock: 1 }, // Level 2 reachable the next day
  { daysToUnlock: 2 }, // Level 3 reachable 2 days afterwards (3 days in total)
  { daysToUnlock: 4 }, // Level 4 reachable 4 days afterwards (1 week in total)
  { daysToUnlock: 7 }, // Level 5 reachable 1 week afterwards (2 weeks in total)
  { daysToUnlock: 14 }, // Level 6 reachable 2 weeks afterwards (4 weeks in total)
  { daysToUnlock: 28 }, // Level 7 reachable 4 weeks afterwards (almost 2 months in total)
  { daysToUnlock: 63 }, // Level 8 reachable 9 weeks afterwards (about 4 months in total)
  { daysToUnlock: 126 } // Level 9 reachable 18 weeks afterwards (about 8 months in total)
  // At this point I guess the card should be remembered for years
]

export const maxLevel = cardMemorizationLevels.length

/**
 * Compute the memorization level of a card
 * @param memorizationStatus the attempts for this card
 * @returns How much a user has remembered a card
 */
const getCardMemorizationLevel = (memorizationStatus: MemorizationHistory | undefined) => {
  if (memorizationStatus === undefined) {
    return 0
  }

  if (memorizationStatus.successfulAttempts.length === 0) return 0

  let level: number = 0
  let successfulAttempts = [...memorizationStatus.successfulAttempts]
  let memorizationTime: number = successfulAttempts[successfulAttempts.length - 1].toMillis()
  let nextAttempt: number

  while (successfulAttempts.length) {
    nextAttempt = successfulAttempts.pop()!.toMillis()

    let daysToWait = cardMemorizationLevels[level].daysToUnlock

    if (nextAttempt >= memorizationTime + daysToWait * dayInMillis) {
      level++
      memorizationTime = nextAttempt
    }
  }

  return level
}

/**
 * Determines when a card can be memorized again given its last memorization and its current level
 * @param lastMemorization the last time the user has memorized the card
 * @param currentLevel the current level for the card
 * @returns When the user can reach the next level if they memorize the card (can be in the future or the past)
 */
const getNextLevelAvailabilityDate = (lastMemorization: Timestamp, currentLevel: number) => {
  const daysToWait = cardMemorizationLevels[currentLevel].daysToUnlock
  const nextStarUnlockTime = lastMemorization.toMillis() + daysToWait * dayInMillis
  return Timestamp.fromMillis(nextStarUnlockTime)
}

/**
 * Determine if a card should be learned or not in the memorization round to come
 * @param nextLevelAvailabilityDate When the nextLevel is available (future or past)
 * @param level The level the card has reached
 * @returns the state of the card, Learned, NotTriedYet or ToLearnAgain
 */
const getCardState: (nextLevelAvailabilityDate: Timestamp, level: number) => CardState = (
  nextLevelAvailabilityDate,
  level
) => {
  if (level === 0) return CardState.NotTriedYet

  if (level >= maxLevel) return CardState.Learned

  const nextLevelIsInTheFuture = Timestamp.now().toMillis() <= nextLevelAvailabilityDate.toMillis()
  return nextLevelIsInTheFuture ? CardState.Learned : CardState.ToLearnAgain
}

const getCardMemorizationStatus: (
  memorizationhistory: MemorizationHistory | undefined
) => CardMemorizationStatus = (memorizationHistory) => {
  if (memorizationHistory?.successfulAttempts?.[0] === undefined) {
    return {
      level: 0,
      nextLevelAvailabilityDate: Timestamp.now(),
      state: CardState.NotTriedYet
    }
  }
  const level = getCardMemorizationLevel(memorizationHistory)
  const lastTimeItHasBeenRemembered = memorizationHistory.successfulAttempts[0]
  const nextLevelAvailabilityDate = getNextLevelAvailabilityDate(lastTimeItHasBeenRemembered, level)
  const state = getCardState(nextLevelAvailabilityDate, level)
  return {
    level,
    nextLevelAvailabilityDate,
    state
  }
}
