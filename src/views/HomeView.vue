<script setup lang="ts">
import { computed, onMounted, type Ref, ref, watch } from 'vue'

import ConnectionLinks from '../components/ConnectionLinks.vue'
import ProgressBar from '../components/ProgressBar.vue'
import { useAuth } from '../composables/useAuth.ts'
import type { Deck } from '../models/deck.ts'
import { type UserMemorizationHistory } from '../models/memorizationHistory.ts'
import {
  getUserMemorizationStatus,
  type UserMemorizationStatus
} from '../models/memorizationStatus.ts'
import { getDeckList, getUserMemorizationHistory } from '../services/firebase'
import { getUserMemorizationHistoryFromLocalStorage } from '../services/localStorageInterface.ts'
import { searchResults } from '../services/search.ts'

const allDecks: Ref<Deck[]> = ref([])

const searchTerm = ref('')

const loading = ref(true)

const getOrderedDecksByLatestMemorization = (
  decks: Deck[],
  memorizationStatus: UserMemorizationStatus
) => {
  const decksToSort = [...decks]
  decksToSort.sort((a, b) => {
    if (memorizationStatus[a.id]?.latestMemorization === undefined) return 1
    if (memorizationStatus[b.id]?.latestMemorization === undefined) return -1

    return (
      memorizationStatus[b.id].latestMemorization!.toMillis() -
      memorizationStatus[a.id].latestMemorization!.toMillis()
    )
  })
  return decksToSort
}

const orderedDecks = computed(() =>
  getOrderedDecksByLatestMemorization(allDecks.value, memorizationStatus.value)
)

const filteredDecks = computed(() =>
  searchResults(searchTerm.value, orderedDecks.value, (deck) => deck.name)
)

onMounted(async () => {
  allDecks.value = await getDeckList()
  memorizationStatus.value = await loadMemorizationStatus(allDecks.value, googleUser.value?.email)
  loading.value = false
})

const memorizationStatus = ref<UserMemorizationStatus>({})
const loadMemorizationStatus = async (decks: Deck[], userEmail: string | null | undefined) => {
  const memorizationHistory: UserMemorizationHistory = userEmail
    ? await getUserMemorizationHistory(userEmail)
    : getUserMemorizationHistoryFromLocalStorage()
  return getUserMemorizationStatus(decks, memorizationHistory)
}

const { googleUser } = useAuth()
</script>

<template>
  <main>
    <input type="text" v-model="searchTerm" class="deck-search" placeholder="Rechercher ..." />
    <div v-if="loading" class="deck-list" aria-busy="true">
      <div v-for="n in 12" :key="n" class="deck skeleton" />
    </div>
    <div v-else class="deck-list">
      <div class="deck" v-for="deck in filteredDecks" :key="deck.id">
        <ProgressBar :deck="deck" :memorization-status="memorizationStatus[deck.id]" />
        <a class="deck-link" :href="`/memorize/${deck.id}`">
          <p>{{ deck.name }}</p>
        </a>
      </div>
    </div>
    <ConnectionLinks />
  </main>
</template>

<style scoped>
.skeleton {
  /* shape comes from .deck: radius 10px, min-height 100px, padding */
  background: linear-gradient(90deg, #f5eee1 25%, #fbf7ef 50%, #f5eee1 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
  height: 128px;
}

@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
  }
}
</style>
