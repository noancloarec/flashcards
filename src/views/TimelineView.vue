<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import TimelineDisplay from '../components/TimelineDisplay.vue'
import { cardIsDateCard, type DateAnswer } from '../models/card.ts'
import type { Deck } from '../models/deck'
import { getDeck } from '../services/firebase'

const loadDeckInUrl: () => Promise<Deck> = async () => {
  const deckId = useRoute().params.deckId as string
  return await getDeck(deckId)
}

const deck = ref<Deck | null>(null)
onMounted(async () => {
  deck.value = await loadDeckInUrl()
})

const eventsOnDisplay = computed<DateAnswer[]>(
  () => deck.value?.cards.filter(cardIsDateCard).map((card) => card.answer) ?? []
)
</script>

<template>
  <section id="timeline">
    <TimelineDisplay
      v-if="eventsOnDisplay.length"
      :events="eventsOnDisplay"
      :current-event="eventsOnDisplay[0]"
      :discontinuities="[]"
    />
    <p v-else>No events to display</p>
  </section>
</template>
<style scoped>
#timeline {
  height: 80vh;
  width: 50vw;
}
</style>
