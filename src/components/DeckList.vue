<script setup lang="ts">
import { computed, onMounted, ref, type Ref } from 'vue'
import type { Deck } from '../models/deck'
import { archiveDeck, getDeckList, unArchiveDeck } from '../services/firebase'
interface Props {
  showArchiveButton?: boolean
  /** The base for the target url of each deck button, if set to /memo/ each link will point to /memo/<deck_id> */
  targetBaseUrl: string
}
const { showArchiveButton = false } = defineProps<Props>()

const decks: Ref<Deck[]> = ref([])

const searchTerm = ref('')

/**x
 * Normalizes a string for search purposes
 * Removes accent and put it into lowercase
 * @param {string}  str  The string to normalize
 */
const normalizeForSearch = (str: string) =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const filteredDecks = computed(() =>
  decks.value.filter((d) =>
    normalizeForSearch(d.name).includes(normalizeForSearch(searchTerm.value))
  )
)

const deckJustArchived = ref('')

const archive = async (deckId: string) => {
  await archiveDeck(deckId)
  deckJustArchived.value = deckId
  setTimeout(() => {
    deckJustArchived.value = ''
  }, 8000)
}
const unarchive = async () => {
  await unArchiveDeck(deckJustArchived.value)
  deckJustArchived.value = ''
}

onMounted(() => {
  getDeckList().then((res) => (decks.value = res))
})
</script>
<template>
  <input type="text" v-model="searchTerm" placeholder="Rechercher ..." />
  <div class="deck-list">
    <a
      class="deck"
      v-for="deck in filteredDecks"
      :key="deck.id"
      :href="`${targetBaseUrl}${deck.id}`"
    >
      <p>
        {{ deck.name }}
      </p>
      <button v-if="showArchiveButton" @click="() => archive(deck.id)">❌</button>
    </a>
  </div>
  <div class="toast">
    <p>Jeu de cartes archivé.</p>
    <button @click="() => unarchive()">Annuler</button>
  </div>
</template>

<style scoped>
input {
  width: 100%;
  border-radius: 10px;
  border: none;
  height: 55px;
  padding-left: 15px;
  margin-right: -15px;
  box-sizing: border-box;
  border: 2px solid #b05a3669;
  background-color: transparent;
  font-size: 1rem;
}
.deck-list {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 30px;
}

.deck {
  background-color: #f5eee1;
  border-radius: 10px;
  display: flex;
  padding: 5px 15px;
  justify-content: center;
  align-content: center;
  flex-direction: column;
  text-align: center;
  color: #2a2b2f;
  text-decoration: none;
  min-height: 100px;
  font-size: 1.15rem;
}
</style>
