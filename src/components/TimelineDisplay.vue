<script setup lang="ts">
/**
 * A timeline to be displayed to the reader so they can better understand how a Story evolves in time
 */
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  type Ref,
  ref,
  useTemplateRef
} from 'vue'

import type { DateAnswer } from '../models/card.ts'
import { type Discontinuity, sumYearSpan } from '../models/discontinuity.ts'
import type { TimePoint } from '../models/timeMarker.ts'
import { autoComputeDiscontinuities } from '../services/autoComputeDiscontinuities.ts'
import TimelineEvent from './TimelineEvent.vue'

const BASE_HEIGHT = 1000 // minimum height of the proportional part, and the reference for the aspect ratio
const DISCONTINUITY_HEIGHT = 100
const LABEL_MARGIN = 3
const MARGIN = 30 // empty space before the first / after the last event, as a share of the span
const BOTTOM_PADDING = 40

const EVENTS_PER_SCREEN = 8 // target number of events visible at once in the container
const MIN_ZOOM = 0.1
const MAX_ZOOM = 20

const MIN_TOP = 10 // blocks are not allowed to move above this, so labels never leave the top of the svg

const YEAR_HEIGHT = 20 // height of one year label in svg units, tune to the font size

interface Cluster {
  first: number // index (in sortedAnswers) of the first label of the block
  count: number // number of labels in the block
  height: number // total height of the stacked labels, margins included
  sum: number // sum of (desired Y - offset inside the block) for each label
  top: number // resulting Y of the block
}

const zoom = computed(() =>
  Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, props.events.length / EVENTS_PER_SCREEN))
)

/**
 * Places labels in order so that none overlaps the next, minimizing the average displacement
 * from their desired top. Returns the resulting top of each label.
 */
const layoutBlocks = (desiredTops: number[], heights: number[], margin: number): number[] => {
  const clusters: Cluster[] = []

  const place = (c: Cluster) => {
    c.top = Math.max(MIN_TOP, c.sum / c.count)
    return c
  }

  desiredTops.forEach((desired, i) => {
    let current = place({ first: i, count: 1, height: heights[i] ?? 0, sum: desired, top: 0 })

    while (clusters.length > 0) {
      const previous = clusters[clusters.length - 1]
      if (previous.top + previous.height + margin <= current.top) break

      clusters.pop()
      const shift = previous.height + margin
      current = place({
        first: previous.first,
        count: previous.count + current.count,
        height: shift + current.height,
        sum: previous.sum + current.sum - current.count * shift,
        top: 0
      })
    }

    clusters.push(current)
  })

  const result: number[] = []
  for (const cluster of clusters) {
    let y = cluster.top
    for (let j = cluster.first; j < cluster.first + cluster.count; j++) {
      result[j] = y
      y += (heights[j] ?? 0) + margin
    }
  }
  return result
}

const stepsY = computed<number[]>(() =>
  layoutBlocks(
    sortedAnswers.value.map((a) => computeY(a.time.start)),
    stepsHeightOnSvg.value,
    LABEL_MARGIN
  )
)

/**
 * Indexes (in sortedAnswers) of the events that display their year:
 * only the first event of each year does.
 */
const yearIndexes = computed(() =>
  sortedAnswers.value.flatMap((a, i) =>
    i === 0 || a.time.start.year !== sortedAnswers.value[i - 1].time.start.year ? [i] : []
  )
)

/**
 * Y coordinate (vertical center) of each year label, indexed like sortedAnswers.
 * Only the indexes in yearIndexes are defined.
 */
const yearsY = computed<Record<number, number>>(() => {
  const indexes = yearIndexes.value
  const tops = layoutBlocks(
    indexes.map((i) => computeY(sortedAnswers.value[i].time.start) - YEAR_HEIGHT / 2),
    indexes.map(() => YEAR_HEIGHT),
    0
  )
  return Object.fromEntries(indexes.map((idx, k) => [idx, tops[k] + YEAR_HEIGHT / 2]))
})

const props = defineProps<{
  events: DateAnswer[]
  // currentEvent: DateAnswer
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

const discontinuities = computed<Discontinuity[]>(() =>
  autoComputeDiscontinuities(props.events.map((e) => e.time))
)
/**
 * A mirror array of sortedAnswers containing their height
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

  return yearSpan - sumYearSpan(discontinuities.value)
})

/**
 * Compute the y coordinate of an event given its date and the timeline configuration
 * @param time The date of the event
 * @returns the y coordinate of the tick on the svg
 */
const computeY = (time: TimePoint) => {
  const discontinuitiesBefore = discontinuities.value.filter((d) => d.to.year <= time.year)
  const yearsDiscontinuedBefore = sumYearSpan(discontinuitiesBefore)
  const years = yearSpanWithoutDiscontinuities.value || 1 // avoids dividing by 0 when all events share a year

  const yearsBefore = time.year - startYear.value - yearsDiscontinuedBefore
  const usableHeight = scaleHeight.value - 2 * MARGIN

  return (
    MARGIN +
    (yearsBefore * usableHeight) / years +
    DISCONTINUITY_HEIGHT * discontinuitiesBefore.length
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
 * Height needed to stack every label without overlap, if they were all squeezed into the
 * area between the first and last tick. Unmeasured labels count as 0 until they report.
 */
const labelsTotalHeight = computed(() =>
  sortedAnswers.value.reduce(
    (sum, _, i) => sum + (stepsHeightOnSvg.value[i] ?? 0) + LABEL_MARGIN,
    0
  )
)

/**
 * Height of the proportional part of the timeline: never smaller than BASE_HEIGHT,
 * grows when the labels need more room.
 * The events only occupy 1 / (1 + 2 * MARGIN_RATIO) of it because of the margins.
 */
const scaleHeight = computed(() =>
  Math.max(BASE_HEIGHT * zoom.value, labelsTotalHeight.value + 2 * MARGIN)
)

/**
 * Keeps the same scale as the initial BASE_HEIGHT viewBox (the 99  avoids a scrollbar when nothing overflows)
 */
const svgHeight = computed(() => `${(svgViewBoxHeight.value / BASE_HEIGHT) * 99}%`)
/**
 * The viewBox fits both the proportional part (with discontinuities)
 * and the bottom of the last label, which is the lowest one since stepsY is increasing.
 */
const svgViewBoxHeight = computed(() => {
  const last = sortedAnswers.value.length - 1
  const lastLabelBottom = (stepsY.value[last] ?? 0) + (stepsHeightOnSvg.value[last] ?? 0)
  const scaleBottom = scaleHeight.value + DISCONTINUITY_HEIGHT * discontinuities.value.length
  return Math.max(scaleBottom, lastLabelBottom + BOTTOM_PADDING, measuredBottom.value)
})

const svgViewBoxWidth = ref<number>(400)
const svgContainer = useTemplateRef('svgContainer')

/**
 * The text wrapper has to be aware of the actual svg width to know where to cut the text.
 * This is done only onMounted and not on window resize, so text wrapping is not responsive.
 */
const computeViewboxWidth = () => {
  const { width, height } = svgContainer.value!.getBoundingClientRect()
  svgViewBoxWidth.value = BASE_HEIGHT * (width / height)
}

const measuredBottom = ref(0)

/**
 * The text wrapping process may make textbox taller as lines are wrapped.
 * This function ensures both the svg height and its viewbox height fit the content (the y-overflow of the svg within the div is scrollable)
 */
const measureContentBottom = () => {
  const box = contentGroup.value!.getBBox()
  measuredBottom.value = box.y + box.height
}

onUpdated(measureContentBottom)

onMounted(computeViewboxWidth)

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
    (eventYInViewBox / svgViewBoxHeight.value) * svgClientRect.height + svgClientRect.y
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

const contentGroup = useTemplateRef<SVGGraphicsElement>('contentGroup')

const layoutKey = ref(0)

let observer: ResizeObserver | undefined
let timer: ReturnType<typeof setTimeout> | undefined
let lastWidth = 0

onMounted(() => {
  const el = svgContainer.value!
  computeViewboxWidth()
  lastWidth = el.clientWidth

  observer = new ResizeObserver(() => {
    clearTimeout(timer)
    // Debounce: a rotation fires several resize events in a row
    timer = setTimeout(() => {
      const width = el.clientWidth
      // Ignore height-only changes (mobile toolbars showing or hiding)
      if (Math.abs(width - lastWidth) < 20) return
      lastWidth = width

      const scrollRatio = el.scrollTop / el.scrollHeight

      computeViewboxWidth()
      measuredBottom.value = 0
      layoutKey.value++ // remounts the events, so every label re-wraps and re-measures

      // Restore the reading position once the new layout is rendered
      nextTick(() =>
        requestAnimationFrame(() => {
          el.scrollTop = scrollRatio * el.scrollHeight
        })
      )
    }, 150)
  })
  observer.observe(el)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  clearTimeout(timer)
})
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
        :y1="computeY(discontinuity.from) + 20"
        :y2="computeY(discontinuity.to) - 20"
        stroke="white"
        :stroke-width="3"
        stroke-dasharray="6"
      ></line>
      <g ref="contentGroup">
        <template
          v-for="(event, i) in sortedAnswers"
          :key="`${layoutKey}-${event.time.sortKey}-${event.name}`"
        >
          <TimelineEvent
            :tick-y="computeY(event.time.start)"
            :text-y="stepsY[i]"
            :year-y="yearsY[i]"
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
      </g>
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
