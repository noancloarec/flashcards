<script setup lang="ts">
/**
This component can be used instead of a <text> component in an svg to avoid overflowing.
The text will be wrapped into several lines.
It works by drawing the the text element, computing its width, and then creating as many wraps as needed to avoid overflowing.
*/
import { computed, type ComputedRef, onUpdated, useTemplateRef } from 'vue'

const props = defineProps<{
  /**
   * The x-coordinate of the text
   */
  x: number
  /**
   * The y-coordinate of the first line of the text (baseline=middle)
   */
  y: number
  /**
   * The text to display
   */
  text: string
  /**
   * The maximum width the text can take (in svg-coordinates)
   */
  maxTextWidth: number
  /**
   * When the text is wrapped, an event is fired so the parent can adjust the coordinates if needed (used to avoid component overlapping)
   * @param newHeight The height taken by the text (in svg-coordinates)
   */
  onHeightChange: (newHeight: number) => void
}>()

const textElement = useTemplateRef<SVGTextElement>('textElement')

/**
 * Wrap a string in several string, so lines aren't more than a given number of characters
 * Makes sure the string is cut on spaces and words aren't cut
 * Source: https://stackoverflow.com/a/40862575/5546046
 * @param text text to wrap
 * @param maxCharacterPerLine The maximum number of characters a line can have
 */
const wrapString: (text: string, maxCharacterPerLine: number) => string[] = (
  text: string,
  maxCharacterPerLine: number
) => {
  const regex = new RegExp(String.raw`(.{${maxCharacterPerLine}}[^ ]* )`, 'g')
  return text.replace(regex, '$1\n').split('\n')
}

/**
 * The lines to display
 * Depends on the text to display and the maximal width of the text.
 */
const parts: ComputedRef<string[]> = computed(() => {
  if (!textElement.value) {
    return []
  }
  const width = textElement.value!.getBBox().width
  const nbParts = Math.ceil(width / props.maxTextWidth)
  const maxPartLength = Math.floor(props.text.length / nbParts)
  return wrapString(props.text, maxPartLength)
})

onUpdated(() => {
  const newHeight = textElement.value!.getBBox().height
  props.onHeightChange(newHeight)
})
</script>

<template>
  <text ref="textElement" :x="x" :y="y - 30" dominant-baseline="middle">
    <template v-if="parts.length === 0">{{ text }}</template>
    <template v-else>
      <tspan v-for="part of parts" :key="part" :x="x" :dy="30">
        {{ part }}
      </tspan>
    </template>
  </text>
</template>
