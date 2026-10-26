<script setup lang="ts">
import { computed } from 'vue'

import type { Deck } from '../models/deck.ts'
import {
  type CardMemorizationStatus,
  CardState,
  type DeckMemorizationStatus,
  maxLevel
} from '../models/memorizationStatus.ts'
import { range } from '../services/javascriptMissingFunctions.ts'
import StarProgress from './StarProgress.vue'

interface Props {
  deck: Deck
  memorizationStatus: DeckMemorizationStatus | undefined
}

const { deck, memorizationStatus } = defineProps<Props>()

const progressByLevel = computed(() => {
  if (!memorizationStatus) {
    return []
  }

  const cardsInDeck = new Set(deck.cards.map((c) => c.id))
  const learnedCardsInDeck = Object.entries(memorizationStatus.cardsMemorization)
    .filter(([cardId]) => cardsInDeck.has(cardId))
    .map(([, cardStatus]) => cardStatus)

  const cardsMemorizedByLevel: number[] = range(1, maxLevel)
    .map((level) => learnedCardsInDeck.filter((cardStatus) => cardStatus.level >= level).length)
    .filter((nbCardsReachingLevel) => nbCardsReachingLevel > 0)

  return cardsMemorizedByLevel.map(
    (nbCardsReachingLevel) => nbCardsReachingLevel / cardsInDeck.size
  )
})

const levelHasCardToLearn: (
  level: number,
  deckMemorizationStatus: DeckMemorizationStatus
) => boolean = (level, deckMemorizationStatus) => {
  const cardMemorizationStatuses = Object.entries(deckMemorizationStatus.cardsMemorization).map(
    ([, cardMemorizationStatus]) => cardMemorizationStatus
  )

  const cardsAtLevel = cardMemorizationStatuses.filter(
    (cardMemorizationStatus) => cardMemorizationStatus.level === level
  )

  const cardShouldBeLearned = (cardMemorizationStatus: CardMemorizationStatus) =>
    [CardState.ToLearnAgain, CardState.NotTriedYet].includes(cardMemorizationStatus.state)

  return cardsAtLevel.filter(cardShouldBeLearned).length > 0
}
</script>

<template>
  <div class="stars-container">
    <StarProgress
      v-for="(progress, i) of progressByLevel"
      :progress="progress"
      :status="
        levelHasCardToLearn(i, memorizationStatus!) ? CardState.ToLearnAgain : CardState.Learned
      "
      :key="i"
    />
    <StarProgress
      v-if="
        progressByLevel.length && levelHasCardToLearn(progressByLevel.length, memorizationStatus!)
      "
      :progress="0"
      :status="CardState.ToLearnAgain"
      :key="progressByLevel.length"
    />
  </div>
</template>
