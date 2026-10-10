<script setup lang="ts">
import { ref } from 'vue'
import type { Deck, FunctionalDeck } from '../models/deck'
import { useAuth } from '../composables/useAuth'
import { db } from '../services/firebase'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import router from '../router'

const { user } = useAuth()

const deck = ref<FunctionalDeck>({ author: user.value!.email!, cards: [], name: '' })
const cardsJson = ref('')
const errorMessage = ref('')

const addDeckToFirestore = async (deck: FunctionalDeck) => {
  const docRef = await addDoc(collection(db, 'deck'), { ...deck, createdAt: serverTimestamp() })
  return docRef.id
}

const saveDeck = async () => {
  try {
    const cards = JSON.parse(cardsJson.value)
    if (!Array.isArray(cards)) {
      throw Error('On attend un tableau de cartes')
    }
    const cardsHaveQuestionAndAnswer = cards.every(
      (obj: object) => Object.keys(obj).sort().join() === 'answer,question'
    )
    if (!cardsHaveQuestionAndAnswer) {
      throw Error('Chaque carte doit avoir 2 champs : question et answer')
    }

    for (const card of cards) {
      card.id = crypto.randomUUID()
    }

    deck.value.cards = cards

    const id = await addDeckToFirestore(deck.value)
    await router.replace(`/memorize/${id}`)
  } catch (error) {
    errorMessage.value = String(error)
    throw error
  }
}
</script>
<template>
  <div class="page">
    <form class="deck-form" @submit.prevent="saveDeck">
      <div class="form-header">
        <h1>Créer un jeu de cartes</h1>
        <p>Ajoutez un nom et vos cartes au format JSON.</p>
      </div>

      <div class="field">
        <label for="deck-name">Nom du jeu</label>
        <input
          id="deck-name"
          type="text"
          placeholder="Ex. Histoire de France"
          v-model="deck.name"
        />
      </div>

      <div class="field">
        <label for="cards">Cartes</label>
        <textarea
          id="cards"
          placeholder='[
  {"question": "1515 ?", "answer": "Marignan"},
]'
          v-model="cardsJson"
          spellcheck="false"
        ></textarea>
        <span class="hint">Chaque carte doit contenir uniquement « question » et « answer ».</span>
      </div>

      <p v-if="errorMessage" class="error">
        {{ errorMessage }}
      </p>

      <button type="submit">Publier le jeu</button>
    </form>
  </div>
</template>
