<script setup lang="ts">
/**
 * A timeline to be displayed to the reader so they can better understand how a Story evolves in time
 */
import { computed, onMounted, onUpdated, type Ref, ref, useTemplateRef, watch } from 'vue'

import type { DateAnswer } from '../models/card.ts'
import { type Discontinuity, sumYearSpan } from '../models/discontinuity.ts'
import type { TimePoint } from '../models/timeMarker.ts'
import TimelineEvent from './TimelineEvent.vue'

const props = defineProps<{
  events: DateAnswer[]
  // currentEvent: DateAnswer
  discontinuities: Discontinuity[]
}>()

const svgElement = useTemplateRef<SVGGraphicsElement>('svgElement')

/**
 * The answers be drawn on the timeline
 */
const sortedAnswers = computed(() =>
  [...props.events].sort((a, b) => a.time.sortKey - b.time.sortKey)
)

const startYear = computed(() => sortedAnswers.value[0].time.start.year)
const endYear = computed(() => sortedAnswers.value.slice(-1)[0].time.start.year)

/**
 * A mirror array of stepsToDisplay containing their height
 */
const stepsHeightOnSvg = ref<number[]>([])

/**
 * A story spans accross a time range (for example a story starting in 1500 and ending in 2000 spans through 500 years)
 * This function computes a story time span in years.
 * As a story can be discontinued (see discontinuities field in timelineOptions), the year span of the discontinuities is substracted from the result.
 * @param story
 * @returns
 */
const yearSpanWithoutDiscontinuities = computed<number>(() => {
  const yearSpan = endYear.value - startYear.value

  return yearSpan - sumYearSpan(props.discontinuities)
})

/**
 * Compute the y coordinate of an event given its date and the timeline configuration
 * @param time The date of the event
 * @returns the y coordinate of the tick on the svg
 */
const computeY = (time: TimePoint) => {
  const eventYear = time.year
  const discontinuitiesBeforeYear = props.discontinuities.filter((d) => d.to.year <= eventYear)
  const yearsDiscontinuedBeforeEvent = sumYearSpan(discontinuitiesBeforeYear)
  const nbNotDiscontinuedYears = yearSpanWithoutDiscontinuities.value

  /**
   * In order to avoid having an event at the 0 coordinate on the svg (it would hardly be visible)
   * There is a slight margin before the first event and after the last event, expressed in years and equal to 10% of the years displayed on the timeline.
   */
  const yearMargin = nbNotDiscontinuedYears * 0.1
  const displayedYears = nbNotDiscontinuedYears + 2 * yearMargin // margin before AND after

  const minYear = startYear.value - yearMargin
  const yearsOnDisplayBeforeEvent = eventYear - minYear - yearsDiscontinuedBeforeEvent

  return (
    (yearsOnDisplayBeforeEvent * 1000) / // Times 1000 because it is the height of the svg
      displayedYears +
    100 * discontinuitiesBeforeYear.length // Times 100 because each discontinuity is 100 unit tall
  )
}

/**
 * The height of each textbox is computed after it is drawn. In order to avoid text overlapping their y coordinate is adjusted.
 * @param elementHeight The height of an element
 * @param elementIndex Its index in the events list
 */
const updateElementsY = (elementHeight: number, elementIndex: number) => {
  stepsHeightOnSvg.value[elementIndex] = elementHeight
}

/**
 * A mirror of Date Answers containing their actual y-coordinate
 */
const stepsY = computed<number[]>(() => {
  const margin = 20
  let previousBottom = -Infinity
  return sortedAnswers.value.map((answer, i) => {
    const y = Math.max(computeY(answer.time.start), previousBottom + margin)
    previousBottom = y + (stepsHeightOnSvg.value[i] ?? 0)
    return y
  })
})

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

const shownEvents: Ref<DateAnswer[]> = ref([...props.events])
// watch(
//   () => props.currentEvent,
//   () => {
//     const y = computeY(props.currentEvent.time.start)
//     const shouldScroll = !eventIsVisible(y, svgElement.value!, svgContainer.value!)
//     if (shouldScroll) {
//       svgContainer.value?.scroll({
//         behavior: 'smooth',
//         top: y - 100
//       })
//     }
//     shownEvents.value.push(props.currentEvent)
//   }
// )
</script>

<template>
  <div class="svg-timeline-container" ref="svgContainer">
    <svg
      :viewBox="`0 0 ${svgViewBoxWidth} ${svgViewBoxHeight}`"
      ref="svgElement"
      :height="svgHeight"
      preserveAspectRatio="xMinYMin"
    >
      <!-- <line
        class="step-indicator"
        x1="100"
        x2="100"
        :y1="-16"
        :y2="10"
        :transform="`translate(0, ${stepsY[sortedAnswers.indexOf(currentEvent)]})`"
        stroke-width="3"
        stroke="black"
      ></line> -->
      <line x1="200" y1="0" x2="200" :y2="svgViewBoxHeight" stroke="black" :stroke-width="1" />
      <line
        v-for="discontinuity in discontinuities"
        :key="discontinuity.from.year"
        x1="200"
        x2="200"
        :y1="computeY(discontinuity.from)"
        :y2="computeY(discontinuity.to)"
        stroke="white"
        :stroke-width="3"
        stroke-dasharray="6"
      ></line>
      <template v-for="(event, i) in sortedAnswers" :key="event.details">
        <TimelineEvent
          :tick-y="computeY(event.time.start)"
          :text-y="stepsY[i]"
          :title="event.name"
          :event="event"
          :displayDate="
            i === 0 || event.time.start.year !== sortedAnswers[i - 1].time.start.year
            // Time label should not be displayed if several events happen at the same dat
          "
          :max-x="svgViewBoxWidth"
          @height-change="(newHeight) => updateElementsY(newHeight, i)"
          :is-shown="shownEvents.includes(event)"
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
