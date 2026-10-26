<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'

import DeckForm from '../components/DeckForm.vue'
import { SavingStatus, useSavingStatus } from '../composables/useSavingStatus.ts'
import type { Deck } from '../models/deck.ts'
import { getDeck, updateDeck } from '../services/firebase.ts'

const editedDeck = ref<Deck | null>(null)

const loadDeckInUrl: () => Promise<Deck> = async () => {
  const deckId = useRoute().params.deckId as string
  return await getDeck(deckId)
}

const { elementSavingStatus } = useSavingStatus(editedDeck)

loadDeckInUrl().then((d) => {
  editedDeck.value = d
  document.title = `Édition - ${d.name}`
})

const saveDeck = async () => {
  elementSavingStatus.value = SavingStatus.Saving
  await updateDeck(editedDeck.value!)
  elementSavingStatus.value = SavingStatus.Saved
}
</script>

<template>
  <main>
    <DeckForm v-if="editedDeck" v-model="editedDeck" />

    <div class="save-button-container">
      <button @click="saveDeck" :disabled="elementSavingStatus !== SavingStatus.NotSaved">
        <template v-if="elementSavingStatus === SavingStatus.NotSaved"> Sauvegarder </template>
        <template v-else-if="elementSavingStatus === SavingStatus.Saving">
          Sauvegarde ...
        </template>
        <template v-else-if="elementSavingStatus === SavingStatus.Saved"> Sauvegardée ✅ </template>
      </button>
    </div>
  </main>
</template>

<style scoped>
.save-button-container {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 1rem;
  display: flex;
  justify-content: right;
  box-shadow: 0 -2px 8px rgb(0 0 0 / 10%);
  z-index: 1000;
  background-color: #fef9ef;
  box-sizing: border-box;
}

.save-button-container button {
  /* width: 100%; */
  max-width: 400px;
  padding: 0.75rem 1rem;
  cursor: pointer;
}

/* Prevent the fixed button from covering the form's last elements. */
main {
  padding-bottom: 5rem;
}
</style>
