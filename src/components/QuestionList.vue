<script setup>

defineProps({
    deck: {
        type: Object,
        required: true
    }
})

</script>
<template>
    <ul>
        <li v-for="card in deck.cards" :key="card.question">
            <div>
                {{ card.question }}
            </div>
            <div>
                {{ card.answer }}
            </div>
        </li>
    </ul>
    <a :href="`/memorize/${deck.id}`">Memorize</a>
</template>