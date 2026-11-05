<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'

import DeckForm from '../components/DeckForm.vue'
import ToolBar from '../components/ToolBar.vue'
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

    <ToolBar :fixed="true">
      <a :href="`/memorize/${editedDeck?.id}`">Mémoriser</a>

      <button @click="saveDeck" :disabled="elementSavingStatus !== SavingStatus.NotSaved">
        <template v-if="elementSavingStatus === SavingStatus.NotSaved"> Sauvegarder </template>
        <template v-else-if="elementSavingStatus === SavingStatus.Saving">
          Sauvegarde ...
        </template>
        <template v-else-if="elementSavingStatus === SavingStatus.Saved"> Sauvegardée ✅ </template>
      </button>
    </ToolBar>
  </main>
</template>
