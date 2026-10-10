export interface Card {
  question: string
  answer: string
  successfulAttempts: number[]
  failedAttempts: number[]
  id: string
}

export enum CardState {
  Learned = 'learned',
  Notlearned = 'notlearned',
  NotTriedYet = 'notTriedYet'
}

export const getCardState = (card: Card): CardState => {
  if (!card.successfulAttempts.length && !card.failedAttempts.length) {
    return CardState.NotTriedYet
  } else if (
    !card.successfulAttempts.length ||
    card.failedAttempts[0] > card.successfulAttempts[0]
  ) {
    return CardState.Notlearned
  } else {
    return CardState.Learned
  }
}
