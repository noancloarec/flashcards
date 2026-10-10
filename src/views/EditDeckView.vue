<script setup lang="ts">
import { ref } from 'vue'
import DeckForm from '../components/DeckForm.vue'
import type { Deck } from '../models/deck.ts'
import { useRoute } from 'vue-router'
import { getDeck, updateDeck } from '../services/firebase.ts'

const editedDeck = ref<Deck | null>(null)
const saving = ref(false)
const loadDeckInUrl: () => Promise<Deck> = async () => {
  const deckId = useRoute().params.deckId as string
  return await getDeck(deckId)
}

loadDeckInUrl().then((d) => (editedDeck.value = d))

const saveDeck = async () => {
  saving.value = true
  await updateDeck(editedDeck.value!)
  saving.value = false
}
</script>

<template>
  <main>
    <DeckForm v-if="editedDeck" v-model="editedDeck" />
    <button @click="saveDeck" :disabled="saving">
      {{ saving ? 'Sauvegarde ...' : 'Sauvegarder' }}
    </button>
  </main>
</template>
