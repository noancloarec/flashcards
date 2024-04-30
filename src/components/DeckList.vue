<script setup>

// import decks from '../assets/data.json'
import { computed, ref } from 'vue';
import { db } from '../utils/cards'
import { collection, getDocs, where, query, orderBy } from "firebase/firestore";

/** @type {Ref.<Array.<Deck>>} */
const decks = ref([])

/**
 * @returns {Promise.<import('../utils/cards').Deck>}
 */
const downloadDeckList = async () => {
    const deckMetadataRef = collection(db, 'deck_metadata')
    const metadata = await getDocs(query(deckMetadataRef, orderBy("name")));
    return metadata.docs.map(d => ({
        id: d.id,
        ...d.data()
    }))
}

const searchTerm = ref("")

const filteredDecks = computed(() => decks.value.filter(d => d.name.toLowerCase().includes(searchTerm.value.toLowerCase())))
downloadDeckList().then(res => decks.value = res)


</script>
<template>
    <input type="text" v-model="searchTerm" placeholder="Rechercher ...">
    <div>
        <a v-for="deck in filteredDecks" :key="deck.id" :href="`/memorize/${deck.id}`">{{ deck.name }}</a>
    </div>
</template>

<style scoped>
input{
    width: 100%;
    border-radius: 20px;
    background-color: #673AB7;
    border: none;
    height: 55px;
    text-align: center;
    color: white;
}
input::placeholder{
    color: white
}

div {
    margin-top: 20px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
}

li {
    min-width: 200px;
    list-style-type: none;
}

a {
    background-color: #f0f0f0;
    border-radius: 20px;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-content: center;
    flex-direction: column;
    text-align: center;
    color: #29162c;
    text-decoration: none;
    min-height: 100px;
}
</style>
