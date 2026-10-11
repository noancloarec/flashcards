export interface Card {
  question: string
  answer: string
  id: string
}

export enum CardState {
  Learned = 'learned',
  Notlearned = 'notlearned',
  NotTriedYet = 'notTriedYet'
}
