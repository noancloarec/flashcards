<script setup>
import { CardState, getCardState } from '@/utils/cards'

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
    <div
      v-for="(card, index) in cards"
      :key="card.question"
      class="card-progress"
      :class="{
        'card-learned': getCardState(card) === CardState.Learned,
        'card-not-learned': getCardState(card) === CardState.Notlearned,
        'card-not-tried-yet': getCardState(card) === CardState.NotTriedYet,
        'current-card': index === currentCardIndex
      }"
      @click="emit('indexChange', index)"
    ></div>
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
  box-sizing: border-box;
}

.card-learned {
  background-color: rgb(121, 189, 139);
}

.card-not-learned {
  background-color: rgb(176, 97, 64);
}

.card-not-tried-yet {
  border: 2px solid rgb(209, 201, 191);
  background-color: transparent;
}
.current-card {
  border-bottom: 4px solid rgb(153, 146, 137);
}
</style>
