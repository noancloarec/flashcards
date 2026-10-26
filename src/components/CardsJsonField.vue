<script setup lang="ts">
import { ref } from 'vue'

import { type Card } from '../models/card'
const cards = defineModel<Card[]>({ required: true })

const cardsJson = ref('')
const errorMessage = ref('')

const updateCards = () => {
  errorMessage.value = ''
  try {
    const parsedCards = JSON.parse(cardsJson.value)
    if (!Array.isArray(parsedCards)) {
      throw Error('On attend un tableau de cartes')
    }
    const cardsHaveQuestionAndAnswer = parsedCards.every(
      (obj: object) => Object.keys(obj).sort().join() === 'answer,question'
    )
    if (!cardsHaveQuestionAndAnswer) {
      throw Error('Chaque carte doit avoir 2 champs : question et answer')
    }

    for (const card of parsedCards) {
      card.id = crypto.randomUUID()
    }

    cards.value = parsedCards
  } catch (error) {
    errorMessage.value = String(error)
  }
}
</script>
<template>
  <div class="field">
    <label for="cards">Cartes</label>
    <textarea
      id="cards"
      placeholder='[
  {"question": "1515 ?", "answer": "Marignan"}
]'
      v-model="cardsJson"
      @change="updateCards"
      spellcheck="false"
    ></textarea>
    <span class="hint">Chaque carte doit contenir uniquement « question » et « answer ».</span>
  </div>

  <p v-if="errorMessage" class="error">
    {{ errorMessage }}
  </p>
</template>
