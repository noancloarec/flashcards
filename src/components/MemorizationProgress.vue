<script setup>
import { CardState, getCardState } from '@/utils/cards';

defineProps({
    cards: {
        type: Array,
        required: true
    },
    currentCardIndex: {
        type: Number,
        required: true
    }
})

const emit = defineEmits(['indexChange'])
</script>

<template>
    <div class="progress">
        <div v-for="(card, index) in cards" :key="card.question" class="card-progress" :class="{
            'card-learned': getCardState(card) === CardState.Learned,
            'card-not-learned': getCardState(card) === CardState.Notlearned,
            'card-not-tried-yet': getCardState(card) === CardState.NotTriedYet,
            'current-card': index === currentCardIndex
        }" @click="emit('indexChange', index)">

        </div>
    </div>
</template>

<style scoped>
.progress {
    display: flex;
    justify-content: center;

}

.card-progress {
    width: 20px;
    height: 20px;
    display: inline-block;
    margin: 5px;
}

.current-card {
    border-bottom: 4px solid black;
}

.card-learned {
    background-color: #89e589;
}

.card-not-learned {
    background-color: #c25858;
}

.card-not-tried-yet {
    background-color: rgba(114, 104, 104, 0.348);
}
</style>
