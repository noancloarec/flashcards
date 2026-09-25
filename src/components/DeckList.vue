<script setup>
// import decks from '../assets/data.json'
import { computed, onMounted, ref } from 'vue'
import { db } from '../utils/cards'
import { collection, getDocs, where, query, orderBy } from 'firebase/firestore'

/** @type {Ref.<Array.<Deck>>} */
const decks = ref([])

/**
 * @returns {Promise.<import('../utils/cards').Deck>}
 */
const downloadDeckList = async () => {
  const deckMetadataRef = collection(db, 'deck_metadata')
  const metadata = await getDocs(query(deckMetadataRef, orderBy('name')))
  return metadata.docs.map((d) => ({
    id: d.id,
    ...d.data()
  }))
}

const searchTerm = ref('')

const filteredDecks = computed(() =>
  decks.value.filter((d) => d.name.toLowerCase().includes(searchTerm.value.toLowerCase()))
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
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
}

li {
  min-width: 200px;
  list-style-type: none;
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
