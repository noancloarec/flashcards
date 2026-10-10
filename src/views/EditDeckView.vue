<script setup lang="ts">
import { ref } from 'vue'
import DeckForm from '../components/DeckForm.vue'
import type { Deck } from '../models/deck.ts'
import { useRoute } from 'vue-router'
import { getDeck } from '../services/firebase.ts'

const editedDeck = ref<Deck | null>(null)
const loadDeckInUrl: () => Promise<Deck> = async () => {
  const deckId = useRoute().params.deckId as string
  return await getDeck(deckId)
}

loadDeckInUrl().then((d) => (editedDeck.value = d))

const saveDeck = async () => {}
</script>

<template>
  <main>
    <DeckForm v-if="editedDeck" v-model="editedDeck" />
    <button @click="saveDeck">Sauvegarder</button>
  </main>
</template>
