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
})

const { googleUser } = useAuth()
const memorizationStatus = ref<UserMemorizationStatus>({})

watch(
  [googleUser, allDecks],
  async () => {
    const memorizationHistory: UserMemorizationHistory = googleUser.value?.email
      ? await getUserMemorizationHistory(googleUser.value.email)
      : getUserMemorizationHistoryFromLocalStorage()
    memorizationStatus.value = getUserMemorizationStatus(allDecks.value, memorizationHistory)
  },
  { immediate: true }
)
</script>

<template>
  <main>
    <input type="text" v-model="searchTerm" class="deck-search" placeholder="Rechercher ..." />

    <div class="deck-list">
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
