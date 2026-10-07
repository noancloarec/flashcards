<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getDoc, doc } from 'firebase/firestore'
import SpaceBar from './icons/SpaceBar.vue'

import MemorizationProgress from './MemorizationProgress.vue'
import type { Deck } from '../models/deck.ts'
import { CardState, getCardState, type Card } from '../models/card.ts'
import { db } from '../services/firebase.ts'

/** @see https://stackoverflow.com/questions/4467539/javascript-modulo-gives-a-negative-result-for-negative-numbers */
const positiveMod = (a: number, b: number) => ((a % b) + b) % b

const getInitialDeck: () => Promise<Deck> = async () => {
  const deckId = useRoute().params.deckId as string
  // Todo better types because deck here (from firestore) does not fit the type description, it only fits it on the following line
  const deck = (await getDoc(doc(db, 'deck', deckId))).data() as Deck
  return {
    ...deck,
    cards: deck.cards.map((card) => ({
      question: card.question
        .replaceAll(/\*.*\*/g, (s) => `<em>${s.substring(1, s.length - 1)}</em>`)
        .replaceAll('\n', '</br>'),
      answer: card.answer
        .replaceAll(/\*.*\*/g, (s) => `<em>${s.substring(1, s.length - 1)}</em>`)
        .replaceAll('\n', '</br>'),
      successfulAttempts: [],
      failedAttempts: []
    }))
  }
}

const deckState = ref<Deck | null>(null)
getInitialDeck().then((d) => (deckState.value = d))
const currentCardIndex = ref(0)
const showAnswer = ref(false)

/** Keyboard nagivation through questions */
document.addEventListener('keyup', (e) => {
  // Space = Reveal answer
  if (!showAnswer.value && e.code == 'Space') {
    showAnswer.value = true
    // Space on revealed == failure
  } else if (showAnswer.value && e.code == 'Space') {
    nextQuestion(false)
    // Enter on revealed = success
  } else if (showAnswer.value && e.code == 'Enter') {
    nextQuestion(true)
    // Arrows = next or previous question
  } else if (e.code == 'ArrowRight' || e.code == 'ArrowLeft') {
    const shift = e.code == 'ArrowRight' ? 1 : -1
    showAnswer.value = false
    currentCardIndex.value = positiveMod(
      currentCardIndex.value + shift,
      deckState.value!.cards.length
    )
  }
})

const getNextIndex = (currentIndex: number, cards: Card[]) => {
  let i = currentIndex
  do {
    i = (i + 1) % cards.length
    if (getCardState(cards[i]) !== CardState.Learned) {
      return i
    }
  } while (i !== currentIndex)
  return -1
}

const cardToDisplay = computed(() => {
  return deckState.value!.cards[currentCardIndex.value]
})

const nextQuestion = (success: boolean) => {
  showAnswer.value = false
  if (success) {
    deckState.value!.cards[currentCardIndex.value].successfulAttempts.unshift(Date.now())
  } else {
    deckState.value!.cards[currentCardIndex.value].failedAttempts.unshift(Date.now())
  }
  currentCardIndex.value = getNextIndex(currentCardIndex.value, deckState.value!.cards)
}

const reset = () => {
  deckState.value = {
    ...deckState.value!,
    cards: deckState.value!.cards.map((card) => ({
      ...card,
      successfulAttempts: [],
      failedAttempts: []
    }))
  }
  currentCardIndex.value = 0
  showAnswer.value = false
}
</script>

<template>
  <div v-if="deckState === null">Loading</div>
  <div v-else-if="currentCardIndex !== -1">
    <h2>{{ deckState.name }}</h2>
    <div class="question" :class="{ reduced: showAnswer }" v-html="cardToDisplay.question"></div>
    <div class="answer" :class="{ shown: showAnswer }" v-html="cardToDisplay.answer"></div>
    <div class="actions">
      <button v-if="!showAnswer" @click="showAnswer = true" class="show-anwser">
        Voir la réponse [
        <SpaceBar class="space-bar" />]
      </button>

      <template v-else>
        <button @click="nextQuestion(true)" class="success">Je le savais [↲]</button>
        <button @click="nextQuestion(false)" class="failed">
          Je ne le savais pas [
          <SpaceBar class="space-bar" />]
        </button>
      </template>
    </div>
    <MemorizationProgress
      :cards="deckState.cards"
      :current-card-index="currentCardIndex"
      @index-change="
        (i) => {
          showAnswer = false
          currentCardIndex = i
        }
      "
    />
  </div>
  <div v-else>
    <p>Vous avez mémorisé toutes les cartes</p>
    <button @click="reset()">Recommencer</button>
  </div>
</template>

<style scoped>
h2 {
  font-weight: normal;
  color: #b05a36;
}
.space-bar {
  width: 20px;
  height: 10px;
  fill: white;
}

.answer {
  opacity: 0;
  height: 0px;
  color: #340a3c00;
  overflow: hidden;
}

.question {
  min-height: 420px;
}

.question.reduced {
  min-height: 200px;
  transition:
    height 0.5s,
    opacity 0.5s;
}

.answer.shown {
  min-height: 200px;
  height: auto;
  opacity: 1;
  transition:
    height.5s,
    opacity 0.5s,
    margin-top 0.5s,
    color 0.2s 0.2s;
  margin-top: 20px;
}

.question,
.answer.shown {
  font-size: 1.7rem;
  width: 90%;
  vertical-align: middle;
  line-height: 30px;
  flex-direction: column;
  display: flex;
  justify-content: center;
  padding: 10px 20px;
  text-align: left;
  color: #2a2b2f;
  border-left: 2px solid #aa193b;
}

.actions {
  display: flex;
  justify-content: space-evenly;
  margin: auto;
  padding: 10px;
  max-width: 350px;
}

button {
  border-radius: 6px;
  border-style: none;
  box-sizing: border-box;
  color: #ffffff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  min-height: 40px;
  line-height: 20px;
  list-style: none;
  margin: 0;
  outline: none;
  padding: 10px 16px;
  position: relative;
  text-align: center;
  text-decoration: none;
  transition: color 100ms;
  vertical-align: baseline;
  touch-action: manipulation;
  display: flex;
  align-items: flex-end;
}

button {
  background-color: rgb(176, 97, 64);
}

button.success {
  background-color: rgb(121, 189, 139);
}

button.failed {
  background-color: rgb(176, 97, 64);
}
</style>
