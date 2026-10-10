<script setup lang="ts">
import type { Card } from '../models/card'
import { type FunctionalDeck } from '../models/deck'

const deck = defineModel<FunctionalDeck>({ required: true })

const moveUp = (card: Card) => {
  const cards = deck.value.cards
  const index = cards.indexOf(card)
  if (index <= 0) return
  ;[cards[index - 1], cards[index]] = [cards[index], cards[index - 1]]
}

const moveDown = (card: Card) => {
  const cards = deck.value.cards
  const index = cards.indexOf(card)
  if (index >= cards.length - 1) return
  ;[cards[index + 1], cards[index]] = [cards[index], cards[index + 1]]
}

const newCard = () => {
  deck.value.cards.push({
    question: '',
    answer: '',
    id: crypto.randomUUID(),
    successfulAttempts: [],
    failedAttempts: []
  })
}
</script>
<template>
  <input type="text" v-model="deck.name" />
  <div v-for="card of deck.cards" :id="card.id">
    <textarea placeholder="Question" v-model="card.question"></textarea>
    <textarea placeholder="Answer" v-model="card.answer"></textarea>
    <button @click="() => moveUp(card)">⬆️</button>
    <button @click="() => moveDown(card)">⬇️</button>
  </div>
  <button @click="newCard">Nouvelle carte</button>
</template>
