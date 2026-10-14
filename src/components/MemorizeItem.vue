<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import SpaceBar from './icons/SpaceBar.vue'

import { Timestamp } from 'firebase/firestore'
import { useAuth } from '../composables/useAuth.ts'
import { CardState, type Card } from '../models/memorization.ts'
import type { Deck } from '../models/deck.ts'
import { getCardState, type DeckMemorizationStatus } from '../models/memorization.ts'
import { SavingStatus } from '../models/savingStatus.ts'
import {
  getDeck,
  getDeckMemorizationStatus,
  saveDeckMemorizationStatus
} from '../services/firebase.ts'
import {
  getDeckMemorizationStatusFromLocalStorage,
  saveDeckMemorizationStatusToLocalStorage
} from '../services/localStorageInterface.ts'
import MemorizationProgress from './MemorizationProgress.vue'
import CardDisplay from './CardDisplay.vue'

/** @see https://stackoverflow.com/questions/4467539/javascript-modulo-gives-a-negative-result-for-negative-numbers */
const positiveMod = (a: number, b: number) => ((a % b) + b) % b

const loadDeckInUrl: () => Promise<Deck> = async () => {
  const deckId = useRoute().params.deckId as string
  return await getDeck(deckId)
}

const deckState = ref<Deck | null>(null)
const currentCardIndex = ref(0)
const showAnswer = ref(false)
const memorizationStatus = ref<DeckMemorizationStatus>({})
const cardStates = ref<CardState[]>([])
const { googleUser } = useAuth()
const savingStatus = ref(SavingStatus.NotSaved)

/**
 * Init the learning state of the cards in the deck, according to the deckMemorizationStatus from firestore if present
 * If deckMemorizationStatus is not specified, all cards are set to NotTriedYet
 * @param deck The loaded deck
 * @param deckMemorizationStatus deckMemorizationStatus from firestore
 */
const initCardStates = (deckCards: Card[], deckMemorizationStatus?: DeckMemorizationStatus) => {
  cardStates.value = deckCards.map((card) => getCardState(deckMemorizationStatus?.[card.id]))

  if (cardStates.value[0] === CardState.Learned) {
    currentCardIndex.value = getNextIndex()
  }
}

onMounted(async () => {
  const deck = await loadDeckInUrl()
  deckState.value = deck
  const deckMemorizationStatus = googleUser.value
    ? await getDeckMemorizationStatus(googleUser.value.email!, deck.id)
    : getDeckMemorizationStatusFromLocalStorage(deck.id)

  memorizationStatus.value = deckMemorizationStatus
  initCardStates(deck.cards, deckMemorizationStatus)
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
 * Register the attempt (learned or not learned) in the memorizationStatus
 * @param success whether the user has learned the card or not
 */
const registerSuccessInMemorizationStatus = () => {
  const currentCardId = deckState.value!.cards[currentCardIndex.value].id
  let memorizationStatusForCard = memorizationStatus.value[currentCardId]
  if (memorizationStatusForCard === undefined) {
    memorizationStatusForCard = {
      successfulAttempts: []
    }
  }

  memorizationStatusForCard.successfulAttempts.unshift(Timestamp.now())
  memorizationStatus.value[currentCardId] = memorizationStatusForCard
}

const nextQuestion = (success: boolean) => {
  savingStatus.value = SavingStatus.NotSaved
  showAnswer.value = false
  if (success) registerSuccessInMemorizationStatus()
  cardStates.value[currentCardIndex.value] = success ? CardState.Learned : CardState.Notlearned
  currentCardIndex.value = getNextIndex()
}

const reset = () => {
  initCardStates(deckState.value!.cards)
  currentCardIndex.value = 0
  showAnswer.value = false
}

const saveProgress = async () => {
  savingStatus.value = SavingStatus.Saving

  const deckId = deckState.value!.id
  if (googleUser.value) {
    const email = googleUser.value.email!
    await saveDeckMemorizationStatus(email, deckId, memorizationStatus.value)
  } else {
    saveDeckMemorizationStatusToLocalStorage(deckId, memorizationStatus.value)
  }

  savingStatus.value = SavingStatus.Saved
}
</script>

<template>
  <div v-if="deckState === null">Loading</div>
  <div v-else-if="currentCardIndex !== -1">
    <h2>{{ deckState.name }}</h2>
    <CardDisplay
      :card="cardToDisplay"
      :show-answer="showAnswer"
      :memorization-status="memorizationStatus[cardToDisplay.id]"
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
  <button @click="saveProgress" :disabled="savingStatus !== SavingStatus.NotSaved">
    <template v-if="savingStatus === SavingStatus.NotSaved"> Sauvegarder la progression </template>
    <template v-else-if="savingStatus === SavingStatus.Saving"> Sauvegarde ... </template>
    <template v-else-if="savingStatus === SavingStatus.Saved">
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
