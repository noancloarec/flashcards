<script setup lang="ts">
import { Timestamp } from 'firebase/firestore'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { useAuth } from '../composables/useAuth.ts'
import { SavingStatus, useSavingStatus } from '../composables/useSavingStatus.ts'
import type { Card } from '../models/card.ts'
import type { Deck } from '../models/deck.ts'
import { type DeckMemorizationHistory } from '../models/memorizationHistory.ts'
import {
  CardState,
  type DeckMemorizationStatus,
  getDeckMemorizationStatus
} from '../models/memorizationStatus.ts'
import {
  getDeck,
  getDeckMemorizationHistory,
  saveDeckMemorizationHistory
} from '../services/firebase.ts'
import {
  getDeckMemorizationHistoryFromLocalStorage,
  saveDeckMemorizationHistoryToLocalStorage as saveDeckMemorizationHistoryToLocalStorage
} from '../services/localStorageInterface.ts'
import CardDisplay from './CardDisplay.vue'
import SpaceBar from './icons/SpaceBar.vue'
import MemorizationProgress from './MemorizationProgress.vue'

/** @see https://stackoverflow.com/questions/4467539/javascript-modulo-gives-a-negative-result-for-negative-numbers */
const positiveMod = (a: number, b: number) => ((a % b) + b) % b

const loadDeckInUrl: () => Promise<Deck> = async () => {
  const deckId = useRoute().params.deckId as string
  return await getDeck(deckId)
}

const deckState = ref<Deck | null>(null)
const currentCardIndex = ref(0)
const showAnswer = ref(false)
const memorizationHistory = ref<DeckMemorizationHistory>({})
const memorizationStatus = ref<DeckMemorizationStatus>({
  cardsMemorization: {},
  latestMemorization: undefined
})
const cardStates = ref<CardState[]>([])
const { googleUser } = useAuth()

const cardsLearnedInSession = ref<Card[]>([])

const { elementSavingStatus } = useSavingStatus(cardsLearnedInSession)

/**
 * Init the learning state of the cards in the deck, according to the deckMemorizationStatus from firestore if present
 * If deckMemorizationStatus is not specified, all cards are set to NotTriedYet
 * @param deck The loaded deck
 * @param deckMemorizationStatus deckMemorizationStatus from firestore
 */
const initCardStates = () => {
  cardStates.value = deckState.value!.cards.map(
    (card) => memorizationStatus.value.cardsMemorization[card.id].state
  )

  if (cardStates.value[0] === CardState.Learned) {
    currentCardIndex.value = getNextIndex()
  }
}

onMounted(async () => {
  const deck = await loadDeckInUrl()
  document.title = deck.name
  deckState.value = deck
  memorizationHistory.value = googleUser.value
    ? await getDeckMemorizationHistory(googleUser.value.email!, deck.id)
    : getDeckMemorizationHistoryFromLocalStorage(deck.id)

  memorizationStatus.value = getDeckMemorizationStatus(deck, memorizationHistory.value)
  initCardStates()
})

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

const getNextIndex = () => {
  let i = currentCardIndex.value

  do {
    i = (i + 1) % cardStates.value.length
    if (cardStates.value[i] !== CardState.Learned) {
      return i
    }
  } while (i !== currentCardIndex.value)
  return -1
}

const cardToDisplay = computed(() => {
  return deckState.value!.cards[currentCardIndex.value]
})

/**
 * Register the attempt (learned or not learned) in the memorization history
 * @param success whether the user has learned the card or not
 */
const registerCardMemorization = (success: boolean) => {
  const currentCard = deckState.value!.cards[currentCardIndex.value]
  const cardIsInLearnedCards =
    cardsLearnedInSession.value.find((card) => card.id === currentCard.id) !== undefined

  if (!success && cardIsInLearnedCards) {
    cardsLearnedInSession.value = cardsLearnedInSession.value.filter(
      (card) => card.id !== currentCard.id
    )
  }
  if (success && !cardIsInLearnedCards) {
    cardsLearnedInSession.value.push(currentCard)
  }
}

const nextQuestion = (success: boolean) => {
  showAnswer.value = false
  registerCardMemorization(success)
  cardStates.value[currentCardIndex.value] = success ? CardState.Learned : CardState.Notlearned
  currentCardIndex.value = getNextIndex()
}

const reset = () => {
  cardStates.value = Array(deckState.value!.cards.length).fill(CardState.NotTriedYet)
  currentCardIndex.value = 0
  showAnswer.value = false
}

const saveProgress = async () => {
  elementSavingStatus.value = SavingStatus.Saving

  for (const learnedCard of cardsLearnedInSession.value) {
    let memorizationHistoryForCard = memorizationHistory.value[learnedCard.id]
    if (memorizationHistoryForCard === undefined) {
      memorizationHistoryForCard = {
        successfulAttempts: []
      }
    }

    memorizationHistoryForCard.successfulAttempts.unshift(Timestamp.now())
    memorizationHistory.value[learnedCard.id] = memorizationHistoryForCard
  }

  const deckId = deckState.value!.id
  if (googleUser.value) {
    const email = googleUser.value.email!
    await saveDeckMemorizationHistory(email, deckId, memorizationHistory.value)
  } else {
    saveDeckMemorizationHistoryToLocalStorage(deckId, memorizationHistory.value)
  }

  elementSavingStatus.value = SavingStatus.Saved
}
</script>

<template>
  <div v-if="deckState === null || Object.keys(memorizationStatus.cardsMemorization).length === 0">
    Loading
  </div>
  <div v-else-if="currentCardIndex !== -1">
    <h2>{{ deckState.name }}</h2>
    <CardDisplay
      :card="cardToDisplay"
      :show-answer="showAnswer"
      :memorization-status="memorizationStatus.cardsMemorization[cardToDisplay.id]"
    />
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
      :card-states="cardStates"
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
  </div>
  <button @click="saveProgress" :disabled="elementSavingStatus !== SavingStatus.NotSaved">
    <template v-if="elementSavingStatus === SavingStatus.NotSaved">
      Sauvegarder la progression
    </template>
    <template v-else-if="elementSavingStatus === SavingStatus.Saving"> Sauvegarde ... </template>
    <template v-else-if="elementSavingStatus === SavingStatus.Saved">
      Progression sauvegardée ✅
    </template>
  </button>
  <button @click="reset()">Recommencer</button>
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

.actions {
  display: flex;
  justify-content: space-evenly;
  margin: auto;
  padding: 10px;
  max-width: 350px;
}
</style>
