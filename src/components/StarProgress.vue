<script setup lang="ts">
import { computed } from 'vue'

import { CardState } from '../models/memorizationStatus'

interface Props {
  progress?: number
  status?: CardState
}

const { progress = 1, status = CardState.Learned } = defineProps<Props>()

// Vertical extent of the star path inside the 24x24 viewBox
const starTop = 2
const starBottom = 21.02
const startHeight = starBottom - starTop
const viewboxSize = 24

// Maximum fill before the star is complete (progress === 1 jumps to 100%)
const maxPartialFill = 0.85

const normalizedProgress = computed(() => Math.max(0, Math.min(1, progress)))

const fillRatio = computed(() =>
  normalizedProgress.value === 1 ? 1 : normalizedProgress.value * maxPartialFill
)

// The clip rect starts at the fill line and extends to the bottom of the viewBox
const clipY = computed(() => starBottom - startHeight * fillRatio.value)
const clipHeight = computed(() => viewboxSize - clipY.value)

const clipId = `star-clip-${Math.random().toString(36).slice(2)}`
</script>

<template>
  <svg
    :class="{ 'star-progress': true, 'to-learn-again': status === CardState.ToLearnAgain }"
    viewBox="0 0 24 24"
    role="img"
    :aria-label="`Progression : ${Math.round(normalizedProgress * 100)} %`"
  >
    <defs>
      <clipPath :id="clipId">
        <rect x="0" :y="clipY" :width="viewboxSize" :height="clipHeight" />
      </clipPath>
    </defs>

    <!-- Background star -->
    <path
      class="star-background"
      d="M12 2 L15.09 8.26 L22 9.27 L17 14.14
         L18.18 21.02 L12 17.77 L5.82 21.02
         L7 14.14 L2 9.27 L8.91 8.26 Z"
    />

    <!-- Filled portion -->
    <path
      class="star-fill"
      :clip-path="`url(#${clipId})`"
      d="M12 2 L15.09 8.26 L22 9.27 L17 14.14
         L18.18 21.02 L12 17.77 L5.82 21.02
         L7 14.14 L2 9.27 L8.91 8.26 Z"
    />
  </svg>
</template>

<style scoped>
.star-progress {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.star-background {
  fill: transparent;
  stroke: rgb(121, 189, 139);
  stroke-width: 1;
  stroke-linejoin: round;
}

.star-fill {
  fill: rgb(121, 189, 139);
}

.to-learn-again .star-background {
  stroke: #ffc12f;
}

.to-learn-again .star-fill {
  fill: #ffc12f;
}
</style>
