<script setup lang="ts">
import { computed, onMounted, ref, watch, type Ref } from 'vue'
import ConnectionLinks from '../components/ConnectionLinks.vue'
import { type UserMemorizationHistory } from '../models/memorizationHistory.ts'
import {
  getUserMemorizationStatus,
  type UserMemorizationStatus
} from '../models/memorizationStatus.ts'

import { getDeckList, getUserMemorizationHistory } from '../services/firebase'
import { getUserMemorizationStatusFromLocalStorage } from '../services/localStorageInterface.ts'
import { searchResults } from '../services/search.ts'
import type { Deck } from '../models/deck.ts'
import { useAuth } from '../composables/useAuth.ts'
import ProgressBar from '../components/ProgressBar.vue'

const decks: Ref<Deck[]> = ref([])

const searchTerm = ref('')

const filteredDecks = computed(() =>
  searchResults(searchTerm.value, decks.value, (deck) => deck.name)
)

onMounted(async () => {
  const deckList = await getDeckList()
  decks.value = deckList
})

const { googleUser } = useAuth()
const memorizationStatus = ref<UserMemorizationStatus>({})

watch(
  [googleUser, decks],
  async () => {
    const memorizationHistory: UserMemorizationHistory = googleUser.value?.email
      ? await getUserMemorizationHistory(googleUser.value.email)
      : getUserMemorizationStatusFromLocalStorage()
    memorizationStatus.value = getUserMemorizationStatus(decks.value, memorizationHistory)
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
        <a class="deck-link" :href="`/memorize${deck.id}`">
          <p>{{ deck.name }}</p>
        </a>
      </div>
    </div>
    <ConnectionLinks />
  </main>
</template>
