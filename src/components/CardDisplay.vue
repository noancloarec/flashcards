<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import type { Card } from '../models/card'
import {
  cardMemorizationLevels,
  CardState,
  dayInMillis,
  getCardMemorizationLevel,
  getCardState,
  getNextLevelAvailabilityDate,
  type CardMemorizationStatus
} from '../models/memorization'
import StarProgress from './StarProgress.vue'
import { Timestamp } from 'firebase/firestore'

interface Props {
  card: Card
  memorizationStatus?: CardMemorizationStatus
  showAnswer: boolean
}

const { card, memorizationStatus, showAnswer } = defineProps<Props>()

const cardIsToLearnAgain = computed(
  () => getCardState(memorizationStatus) === CardState.ToLearnAgain
)

/**
 * Controls whether the star notification is visible.
 */
const showStarTooltip = ref(false)

/**
 * Unique identifier used to associate the notification with its trigger.
 */
const starTooltipId = `star-tooltip-${Math.random().toString(36).slice(2, 11)}`

let tooltipTimeout: ReturnType<typeof setTimeout> | undefined

/**
 * Converts the formatting that has been done in JSON (italic and newline)
 * to HTML.
 *
 * @param str The string to format.
 * @returns The HTML version of the string.
 */
const jsonToHtml = (str: string) =>
  str
    .replaceAll(/\*.*\*/g, (s) => `<em>${s.substring(1, s.length - 1)}</em>`)
    .replaceAll('\n', '</br>')

/**
 * Formats a date in French.
 *
 * @param date The date to format.
 * @returns A date such as "9 septembre à 16h08".
 */
const dateTooltipFormat = (date: Date) =>
  date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long'
  }) +
  ' à ' +
  date
    .toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
    .replace(':', 'h')

/**
 * Returns the current memorization level of the card.
 */
const memorizationLevel = computed(() => getCardMemorizationLevel(memorizationStatus))

/**
 * Calculates when the next memorization star becomes available.
 *
 * Assumes successfulAttempts[0] contains the most recent successful attempt.
 * Returns an empty string when the next star is already available or when
 * no successful attempts are recorded.
 */
const nextStarUnlockLabel = computed(() => {
  if (memorizationStatus?.successfulAttempts[0] === undefined) {
    return ''
  }

  const nextLevelAvailabilityDate = getNextLevelAvailabilityDate(
    memorizationStatus.successfulAttempts[0],
    memorizationLevel.value
  )

  if (nextLevelAvailabilityDate.toMillis() <= Timestamp.now().toMillis()) {
    return 'Réponds à la question pour gagner une nouvelle étoile'
  }

  return 'Prochaine étoile atteignable le ' + dateTooltipFormat(nextLevelAvailabilityDate.toDate())
})

/**
 * Displays the notification at the bottom of the screen for 3 seconds.
 *
 * Each interaction restarts the timer. If no next star is pending, the
 * notification is not displayed.
 */
const showTooltipTemporarily = () => {
  if (!nextStarUnlockLabel.value) return

  showStarTooltip.value = true

  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout)
  }

  tooltipTimeout = setTimeout(() => {
    showStarTooltip.value = false
    tooltipTimeout = undefined
  }, 3000)
}

/**
 * Clears the pending timer when the component is unmounted.
 */
onUnmounted(() => {
  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout)
  }
})
</script>

<template>
  <div class="question" :class="{ reduced: showAnswer }">
    <div class="stars-container">
      <button
        type="button"
        class="stars-button"
        :aria-label="nextStarUnlockLabel || `Niveau de mémorisation : ${memorizationLevel} étoiles`"
        :aria-describedby="showStarTooltip && nextStarUnlockLabel ? starTooltipId : undefined"
        @click="showTooltipTemporarily"
      >
        <StarProgress v-for="(_, index) in memorizationLevel" :key="index" />
        <StarProgress v-if="cardIsToLearnAgain" :status="CardState.ToLearnAgain" />
      </button>
    </div>

    <div class="question-content" v-html="jsonToHtml(card.question)"></div>
  </div>

  <div class="answer" :class="{ shown: showAnswer }" v-html="jsonToHtml(card.answer)"></div>

  <!--
    Teleport places the notification directly under <body>, preventing
    parent containers from clipping it.
  -->
  <Teleport to="body">
    <div
      v-if="showStarTooltip && nextStarUnlockLabel"
      :id="starTooltipId"
      role="status"
      class="star-tooltip"
    >
      {{ nextStarUnlockLabel }}
    </div>
  </Teleport>
</template>

<style>
.answer {
  opacity: 0;
  height: 0;
  color: #340a3c00;
  overflow: hidden;
}

.question-content {
  min-height: 420px;
}

.question.reduced > .question-content {
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
    height 0.5s,
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
  padding: 10px 20px;
  color: #2a2b2f;
  border-left: 2px solid #aa193b;
}

.question-content,
.answer {
  flex-direction: column;
  text-align: left;
  display: flex;
  justify-content: center;
}

.stars-container {
  display: inline-flex;
  height: 28px;
}

.stars-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

.stars-button:focus-visible {
  outline: 2px solid #aa193b;
  outline-offset: 4px;
  border-radius: 4px;
}

.star-tooltip {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);

  width: max-content;
  max-width: calc(100vw - 32px);
  box-sizing: border-box;

  padding: 12px 20px;
  background: #2a2b2f;
  color: white;
  border-radius: 8px;

  font-size: 0.95rem;
  line-height: 1.4;
  text-align: center;

  z-index: 9999;
  overflow-wrap: break-word;
  box-shadow: 0 2px 8px rgb(0 0 0 / 20%);

  animation: tooltip-appear 0.2s ease-out;
}

@keyframes tooltip-appear {
  from {
    opacity: 0;
    transform: translate(-50%, 8px);
  }

  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .star-tooltip {
    animation: none;
  }
}
</style>
