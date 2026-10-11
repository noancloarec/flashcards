<script setup lang="ts">
import { CardState } from '../models/card'

defineProps<{
  cardStates: CardState[]
  currentCardIndex: number
}>()
const emit = defineEmits<{ indexChange: [index: number] }>()
</script>

<template>
  <div class="progress">
    <button
      v-for="(cardState, index) in cardStates"
      :key="index"
      class="card-progress"
      :class="{
        'card-learned': cardState === CardState.Learned,
        'card-not-learned': cardState === CardState.Notlearned,
        'card-not-tried-yet': cardState === CardState.NotTriedYet,
        'current-card': index === currentCardIndex
      }"
      @click="emit('indexChange', index)"
    ></button>
  </div>
</template>

<style scoped>
.progress {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

.card-progress {
  width: 20px;
  height: 20px;
  display: inline-block;
  margin: 5px;
  border: none;
  box-sizing: border-box;
  border: 2px solid transparent;
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
