<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'

import DeckForm from '../components/DeckForm.vue'
import SaveButton from '../components/SaveButton.vue'
import ToolBar from '../components/ToolBar.vue'
import type { Deck } from '../models/deck.ts'
import { getDeck, updateDeck } from '../services/firebase.ts'

const editedDeck = ref<Deck | null>(null)

const loadDeckInUrl: () => Promise<Deck> = async () => {
  const deckId = useRoute().params.deckId as string
  return await getDeck(deckId)
}

loadDeckInUrl().then((d) => {
  editedDeck.value = d
  document.title = `Édition - ${d.name}`
})
</script>

<template>
  <main v-if="editedDeck">
    <DeckForm v-if="editedDeck" v-model="editedDeck" />

    <ToolBar :fixed="true">
      <a :href="`/memorize/${editedDeck?.id}`">Mémoriser</a>

      <SaveButton :elementToWatch="editedDeck" @save="() => updateDeck(editedDeck!)" />
    </ToolBar>
  </main>
</template>
