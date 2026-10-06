<script setup lang="ts">
import { computed, onMounted, ref, type Ref } from 'vue'
import { db } from '../utils/cards'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import type { Deck } from '../models/deck'

const decks: Ref<Deck[]> = ref([])

const downloadDeckList: () => Promise<Deck[]> = async () => {
  const deckRef = collection(db, 'deck')
  const decks = await getDocs(query(deckRef, orderBy('name')))
  return decks.docs.map(
    (d) =>
      ({
        id: d.id,
        ...d.data()
      }) as Deck
  )
}

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

onMounted(() => {
  downloadDeckList().then((res) => (decks.value = res))
})
</script>
<template>
  <input type="text" v-model="searchTerm" placeholder="Rechercher ..." />
  <div>
    <a v-for="deck in filteredDecks" :key="deck.id" :href="`/memorize/${deck.id}`">{{
      deck.name
    }}</a>
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

div {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 30px;
}

a {
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
