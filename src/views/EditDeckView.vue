<script setup lang="ts">
import { ref, watch } from 'vue'
import DeckForm from '../components/DeckForm.vue'
import type { Deck } from '../models/deck.ts'
import { useRoute } from 'vue-router'
import { getDeck, updateDeck } from '../services/firebase.ts'
import { SavingStatus } from '../models/savingStatus.ts'

const editedDeck = ref<Deck | null>(null)
const savingStatus = ref(SavingStatus.Saved)

const loadDeckInUrl: () => Promise<Deck> = async () => {
  const deckId = useRoute().params.deckId as string
  return await getDeck(deckId)
}

loadDeckInUrl().then((d) => (editedDeck.value = d))

const saveDeck = async () => {
  savingStatus.value = SavingStatus.Saving
  try {
    await updateDeck(editedDeck.value!)
  } finally {
    savingStatus.value = SavingStatus.Saved
  }
}

watch(editedDeck, () => (savingStatus.value = SavingStatus.NotSaved), { deep: true })
</script>

<template>
  <main>
    <DeckForm v-if="editedDeck" v-model="editedDeck" />

    <div class="save-button-container">
      <button @click="saveDeck" :disabled="savingStatus !== SavingStatus.NotSaved">
        <template v-if="savingStatus === SavingStatus.NotSaved"> Sauvegarder </template>
        <template v-else-if="savingStatus === SavingStatus.Saving"> Sauvegarde ... </template>
        <template v-else-if="savingStatus === SavingStatus.Saved"> Sauvegardée ✅ </template>
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
