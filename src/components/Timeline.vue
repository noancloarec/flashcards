<script setup lang="ts">
/**
 * A timeline to be displayed to the reader so they can better understand how a Story evolves in time
 */
import { computed, onMounted, onUpdated, type Ref, ref, useTemplateRef, watch } from 'vue'

import TimeLineEvent from '@/components/TimeLineEvent.vue'
import { getYearSpanWithoutDiscontinuities, sortedSteps, type Story } from '@/models/Story'
import type { StoryEvent } from '@/models/StoryEvent'

import { sumYearSpan, type Discontinuity } from '../models/discontinuity'
import type { DateAnswer } from '../models/card'

const props = defineProps<{
  dateAnswers: DateAnswer[]
  currentEvent: DateAnswer
  discontinuities: Discontinuity[]
}>()

const svgElement = useTemplateRef<SVGGraphicsElement>('svgElement')

/**
 * The answers be drawn on the timeline
 */
const sortedAnswers = computed(() =>
  [...props.dateAnswers].sort((a, b) => a.time.sortKey - b.time.sortKey)
)

/**
 * A mirror array of stepsToDisplay containing their height
 */
const stepsHeightOnSvg = ref<number[]>(Array<number>(props.dateAnswers.length))

/**
 * A story spans accross a time range (for example a story starting in 1500 and ending in 2000 spans through 500 years)
 * This function computes a story time span in years.
 * As a story can be discontinued (see discontinuities field in timelineOptions), the year span of the discontinuities is substracted from the result.
 * @param story
 * @returns
 */
export const getYearSpanWithoutDiscontinuities = computed<number>(() => {
  const firstYear = sortedAnswers.value[0].time.start.year
  const endYear = sortedAnswers.value.slice(-1)[0].time.start.year
  const yearSpan = endYear - firstYear

  return yearSpan - sumYearSpan(props.discontinuities)
})

/**
 * Compute the y coordinate of an event given its date and the timeline configuration
 * @param time The date of the event
 * @returns the y coordinate of the tick on the svg
 */
const computeY = (time: Date) => {
  const eventYear = time.getUTCFullYear()
  const discontinuitiesBeforeYear = props.discontinuities.filter((d) => d.to.year <= eventYear)
  const discontinutySizeBeforeYear = sumYearSpan(discontinuitiesBeforeYear)
  const nbNotDiscontinuedYears = getYearSpanWithoutDiscontinuities(props.story)

  /**
   * In order to avoid having an event at the 0 coordinate on the svg (it would hardly be visible)
   * There is a slight margin before the first event and after the last event, expressed in years and equal to 10% of the years displayed on the timeline.
   */
  const yearMargin = nbNotDiscontinuedYears * 0.1

  const minYear = stepsToDisplay.value[0].time.getUTCFullYear() - yearMargin
  const nbNotDiscontinuedYearsBeforeYear = eventYear - minYear - discontinutySizeBeforeYear

  return (
    (nbNotDiscontinuedYearsBeforeYear * 1000) / nbNotDiscontinuedYears +
    100 * discontinuitiesBeforeYear.length
  )
}

/**
 * The height of each textbox is computed after it is drawn. In order to avoid text overlapping their y coordinate is adjusted.
 * @param elementHeight The height of an element
 * @param elementIndex Its index in the events list
 */
const updateElementsY = (elementHeight: number, elementIndex: number) => {
  stepsHeightOnSvg.value[elementIndex] = elementHeight
  adjustElementsYOffset()
}

/**
 * Make sur no textbox overlaps another
 */
const adjustElementsYOffset = () => {
  let offset = 0
  for (const [i, currentElementHeight] of stepsHeightOnSvg.value.slice(0, -1).entries()) {
    const currentElementBottom = stepsY.value[i] + currentElementHeight
    const nextElementTop = stepsY.value[i + 1]
    if (currentElementBottom > nextElementTop) {
      offset += currentElementBottom - nextElementTop + 20 // 20 is the margin
      stepsY.value[i + 1] += offset
    }
  }
}
/**
 * A mirror of stepsToDisplay containing their actual y-coordinate
 */
const stepsY = ref<number[]>(stepsToDisplay.value.map((step) => computeY(step.time)))

const svgHeight = ref<string>('99%')
const svgViewBoxHeight = ref<number>(1000)
const svgViewBoxWidth = ref<number>(400)
const svgContainer = useTemplateRef('svgContainer')

/**
 * The text wrapper has to be aware of the actual svg width to know where to cut the text.
 * This is done only onMounted and not on window resize, so text wrapping is not responsive.
 */
const computeViewboxWidth = () => {
  const boundingClientRect = svgContainer.value!.getBoundingClientRect()
  const aspectRatio = boundingClientRect.width / boundingClientRect.height
  svgViewBoxWidth.value = svgViewBoxHeight.value * aspectRatio
}

/**
 * The text wrapping process may make textbox taller as lines are wrapped.
 * This function ensures both the svg height and its viewbox height fit the content (the y-overflow of the svg within the div is scrollable)
 */
const makeViewboxHeightFitContent = () => {
  const actualHeight = svgElement.value!.getBBox().height
  const yOverflowInPercent = Math.ceil(((actualHeight - 1000) / 1000) * 100)
  svgHeight.value = 99 + yOverflowInPercent + '%'
  svgViewBoxHeight.value = actualHeight
}

onMounted(computeViewboxWidth)

onUpdated(makeViewboxHeightFitContent)

/**
 * Determines wether a y-coordinate of an svg is visible dependending on how its container is scrolled
 * @param eventYInViewBox
 * @param svgElement
 * @param container
 */
const eventIsVisible = (
  eventYInViewBox: number,
  svgElement: SVGGraphicsElement,
  container: HTMLElement
) => {
  const svgClientRect = svgElement.getBoundingClientRect()
  const containerClientRect = container.getBoundingClientRect()

  const eventClientY =
    (eventYInViewBox / svgElement.getBBox().height) * svgClientRect.height + svgClientRect.y

  return eventClientY > containerClientRect.y && eventClientY < containerClientRect.bottom
}

const shownEvents: Ref<StoryEvent[]> = ref([props.currentEvent])
watch(
  () => props.currentEvent,
  () => {
    const y = computeY(props.currentEvent.time)
    const shouldScroll = !eventIsVisible(y, svgElement.value!, svgContainer.value!)
    if (shouldScroll) {
      svgContainer.value?.scroll({
        behavior: 'smooth',
        top: y - 100
      })
    }
    shownEvents.value.push(props.currentEvent)
  }
)
</script>

<template>
  <div class="svg-timeline-container" ref="svgContainer">
    <svg
      :viewBox="`0 0 ${svgViewBoxWidth} ${svgViewBoxHeight}`"
      ref="svgElement"
      :height="svgHeight"
      preserveAspectRatio="xMinYMin"
    >
      <line
        class="step-indicator"
        x1="100"
        x2="100"
        :y1="-16"
        :y2="10"
        :transform="`translate(0, ${stepsY[stepsToDisplay.indexOf(currentEvent)]})`"
        stroke-width="3"
        stroke="black"
      ></line>
      <line x1="200" y1="0" x2="200" :y2="svgViewBoxHeight" stroke="black" :stroke-width="1" />
      <line
        v-for="discontinuity in discontinuities"
        :key="discontinuity.from.getUTCFullYear()"
        x1="200"
        x2="200"
        :y1="computeY(discontinuity.from)"
        :y2="computeY(discontinuity.to)"
        stroke="white"
        :stroke-width="3"
        stroke-dasharray="6"
      ></line>
      <template v-for="(step, i) in stepsToDisplay" :key="step.name">
        <TimeLineEvent
          :tick-y="computeY(step.time)"
          :text-y="stepsY[i]"
          :title="step.name"
          :year="step.time.getUTCFullYear()"
          :display-year="
            i === 0 || step.time.getUTCFullYear() !== stepsToDisplay[i - 1].time.getUTCFullYear()
          "
          :max-x="svgViewBoxWidth"
          @height-change="(newHeight) => updateElementsY(newHeight, i)"
          :is-shown="shownEvents.includes(step)"
        />
      </template>
    </svg>
  </div>
</template>

<style scoped>
.svg-timeline-container {
  overflow-y: scroll;
  height: 100%;
}
svg {
  width: 100%;
  font-size: 1.6em;
}
.step-indicator {
  transition: all cubic-bezier(0.6, 0, 0, 1.01) 0.4s;
}
</style>
