<script setup>

// import decks from '../assets/data.json'
import { ref } from 'vue';
import {db} from '../utils/cards'
import { collection, getDocs , where, query} from "firebase/firestore"; 

const decks = ref([])

/**
 * @returns {Promise.<import('../utils/cards').Deck>}
 */
const downloadDeckList = async () => {
    const metadata = await getDocs(collection(db, 'deck_metadata'));
    return metadata.docs.map(d => ({
        id : d.id,
        ...d.data()
    }))
}

downloadDeckList().then(res => decks.value = res)

</script>
<template>
    <div>
        <a v-for="deck in decks" :key="deck.id" :href="`/memorize/${deck.id}`">{{ deck.name }}</a>
    </div>
</template>

<style scoped>
div {
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
    padding: 5px;
    min-height: 100px;
}
</style>
