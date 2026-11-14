<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import LoadingIndicator from '../components/LoadingIndicator.vue'
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
    <LoadingIndicator v-else />
  </section>
</template>
<style scoped>
#timeline {
  width: 100%;
  height: 90dvh;
}
</style>
