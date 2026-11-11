<script setup lang="ts">
/**
 * This is the component for an event on the timeline
 */
import TextWrapped from './TextWrapped.vue'

defineProps<{
  /**
   * Where the tick should be drawn on the line
   */
  tickY: number
  /**
   * Where the text should be drawn, not necessarily the same as the tick to prevent text overlapping
   */
  textY: number
  /**
   * The year to display
   */
  year: number
  /**
   * The title of the event
   */
  title: string
  /**
   * Wether the year should be drawn or not. It should not be drawn when 2 events take place the same year
   */
  displayYear: boolean

  /**
   * When the text is wrapped, an event is fired so the parent can adjust the coordinates if needed (used to avoid component overlapping)
   * @param newHeight The height taken by the text (in svg-coordinates)
   */

  onHeightChange: (newHeight: number) => void
  /**
   * The right margin coordinate, used by child TextWrapped so the text do not overflow the svg
   */
  maxX: number
  isShown: boolean
}>()
</script>

<template>
  <line
    :class="{ shown: isShown }"
    x1="190"
    x2="210"
    :y1="tickY"
    :y2="tickY"
    stroke="black"
    stroke-width="1"
  ></line>
  <text
    :class="{ shown: isShown }"
    v-if="displayYear"
    x="180"
    text-anchor="end"
    :y="textY"
    dominant-baseline="middle"
  >
    {{ year }}
  </text>
  <TextWrapped
    :x="220"
    :y="textY"
    :text="title"
    :max-text-width="maxX - 220"
    @height-change="onHeightChange"
    :class="{ shown: isShown }"
  />
  <template v-if="textY !== tickY">
    <!-- Lines from the tick to the text -->
    <!-- <line x1="205" x2="215" :y1="tickY" :y2="tickY" stroke="black" stroke-width="1"></line> -->
    <line
      :class="{ shown: isShown }"
      x1="210"
      x2="210"
      :y1="tickY"
      :y2="textY"
      stroke="black"
      stroke-width="1"
    ></line>
    <line
      :class="{ shown: isShown }"
      x1="210"
      x2="215"
      :y1="textY"
      :y2="textY"
      stroke="black"
      stroke-width="1"
    ></line>
  </template>
  <template v-if="displayYear && textY !== tickY">
    <!-- Lines from the tick to the year -->
    <line
      :class="{ shown: isShown }"
      x1="190"
      x2="190"
      :y1="tickY"
      :y2="textY"
      stroke="black"
      stroke-width="1"
    ></line>
    <line
      :class="{ shown: isShown }"
      x1="185"
      x2="190"
      :y1="textY"
      :y2="textY"
      stroke="black"
      stroke-width="1"
    ></line>
  </template>
</template>

<style scoped>
* {
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}
.shown {
  opacity: 1;
}
</style>
