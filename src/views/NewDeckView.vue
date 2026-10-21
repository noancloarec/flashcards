<script setup lang="ts">
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'
import type { FunctionalDeck } from '../models/deck'
import router from '../router.ts'
import { db } from '../services/firebase'
import CardsJsonField from '../components/CardsJsonField.vue'

const { googleUser } = useAuth()

const deck = ref<FunctionalDeck>({ author: googleUser.value!.email!, cards: [], name: '' })

const addDeckToFirestore = async (deck: FunctionalDeck) => {
  const docRef = await addDoc(collection(db, 'deck'), { ...deck, createdAt: serverTimestamp() })
  return docRef.id
}

const saveDeck = async () => {
  const id = await addDeckToFirestore(deck.value)
  await router.replace(`/edit-deck/${id}`)
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
      <CardsJsonField v-model="deck.cards" />

      <button type="submit">Publier le jeu</button>
    </form>
  </div>
</template>
