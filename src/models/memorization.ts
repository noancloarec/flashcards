import { Timestamp } from 'firebase/firestore'

/**
 * When and how many times a user has remembered a Card
 */
export interface CardMemorizationStatus {
  successfulAttempts: Timestamp[] // Sorted descendingly (most recent is first)
}

export type CardId = string

export type DeckMemorizationStatus = Record<CardId, CardMemorizationStatus>

export type DeckId = string
export type UserMemorizationStatus = Record<DeckId, DeckMemorizationStatus>

interface CardMemorizationSpan {
  daysToUnlock: number
}

export const cardMemorizationLevels: CardMemorizationSpan[] = [
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

export const dayInMillis = 24 * 60 * 60 * 1000

/**
 * Compute the memorization level of a card
 * @param memorizationStatus the attempts for this card
 * @returns How much a user has remembered a card
 */
export const getCardMemorizationLevel = (
  memorizationStatus: CardMemorizationStatus | undefined
) => {
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
