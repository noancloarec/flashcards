import type { TimeMarker } from './timeMarker'

export type CardId = string

export interface DateAnswer {
  time: TimeMarker
  details?: string
}

export interface Card {
  question: string
  answer: string | DateAnswer
  id: CardId
}
export interface SimpleCard extends Card {
  answer: string
}

export interface DateCard extends Card {
  answer: DateAnswer
}

export const cardIsSimpleCard = (card: Card): card is SimpleCard => typeof card.answer === 'string'

export const cardIsDateCard = (card: Card): card is DateCard =>
  typeof card.answer === 'object' && card.answer !== null && 'time' in card.answer
