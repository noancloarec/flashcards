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

const deckJustArchived = ref<Deck | null>(null)

const archive = async (deck: Deck) => {
  await archiveDeck(deck.id)

  decks.value = decks.value.filter((d) => d !== deck)
  deckJustArchived.value = deck
  setTimeout(() => {
    deckJustArchived.value = null
  }, 10000)
}
const unarchive = async () => {
  await unArchiveDeck(deckJustArchived.value!.id)
  decks.value.push(deckJustArchived.value!)
  decks.value.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
  deckJustArchived.value = null
}

onMounted(() => {
  getDeckList().then((res) => (decks.value = res))
})
</script>
<template>
  <input type="text" v-model="searchTerm" placeholder="Rechercher ..." />

  <div class="deck-list">
    <div class="deck" v-for="deck in filteredDecks" :key="deck.id">
      <a class="deck-link" :href="`${targetBaseUrl}${deck.id}`">
        <p>{{ deck.name }}</p>
      </a>

      <button
        v-if="showArchiveButton"
        class="archive-button"
        @click="archive(deck)"
        aria-label="Archiver ce jeu de cartes"
        title="Archiver"
      >
        ❌
      </button>
    </div>
  </div>

  <Transition name="toast">
    <div v-if="deckJustArchived" class="toast">
      <p>Jeu de cartes archivé.</p>
      <button @click="unarchive">Annuler</button>
    </div>
  </Transition>
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
  position: relative;
  background-color: #f5eee1;
  border-radius: 10px;
  min-height: 100px;
  color: #2a2b2f;
}

.deck-link {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  padding: 15px 40px;
  box-sizing: border-box;

  text-align: center;
  color: inherit;
  text-decoration: none;
  font-size: 1.15rem;
}

.deck-link p {
  margin: 0;
}

.archive-button {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;

  display: flex;
  align-items: center;
  justify-content: center;

  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-size: 0.9rem;
}

.archive-button:hover {
  background-color: rgb(42 43 47 / 10%);
}

.toast {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  padding: 15px 20px;
  background-color: #2a2b2f;
  color: #f5eee1;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 20%);

  font-size: 1rem;
}

.toast p {
  margin: 0;
}

.toast button {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  background-color: #f5eee1;
  color: #2a2b2f;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: bold;
  white-space: nowrap;
}

.toast button:hover {
  background-color: #e0d5c4;
}

/* Enter and leave transitions */
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Mobile layout */
@media (max-width: 480px) {
  .toast {
    left: 15px;
    right: 15px;
    bottom: 15px;
    gap: 10px;
    padding: 12px 15px;
  }
}
</style>
