<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  type Card,
  cardIsDateCard,
  cardIsSimpleCard,
  type DateAnswer,
  type DateCard,
  type SimpleCard
} from '../models/card'
import { toReadableTimeMarker } from '../models/timeMarker.ts'
import { getEventName } from '../services/eventNameDetection.ts'
import { findFirstTimeMarker, type TimeMatch } from '../services/timeMarkerDetection.ts'
import DateCardField from './DateCardField.vue'
import SimpleCardField from './SimpleCardField.vue'

const card = defineModel<Card>({ required: true })
const cachedSimpleAnswer = ref<string>(cardIsSimpleCard(card.value) ? card.value.answer : '')
const cachedDateAnswer = ref<any>(
  cardIsDateCard(card.value) ? card.value.answer : { time: undefined }
)
const answerIsADate = ref(cardIsDateCard(card.value))

const dateDetectedInStringAnswer = computed<TimeMatch | null>(() =>
  cardIsSimpleCard(card.value) ? findFirstTimeMarker(card.value.answer) : null
)

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

const predictDateAnswer = (
  match: TimeMatch,
  originalAnwser: string,
  question: string
): DateAnswer => {
  let details = originalAnwser.substring(match.index + match.text.length).trim()
  if (details.startsWith(',') || details.startsWith('.')) {
    details = details.substring(1).trim()
  }
  let result: DateAnswer = { time: match.marker, name: getEventName(question) }
  if (details) {
    result = { ...result, details: capitalize(details) }
  }
  return result
}

const toggleDate = () => {
  answerIsADate.value = !answerIsADate.value
  if (answerIsADate.value) {
    cachedSimpleAnswer.value = card.value.answer as string

    if (dateDetectedInStringAnswer.value && !cachedDateAnswer.value?.time) {
      card.value.answer = predictDateAnswer(
        dateDetectedInStringAnswer.value,
        cachedSimpleAnswer.value,
        card.value.question
      )
    } else {
      card.value.answer = cachedDateAnswer.value
    }
  } else {
    cachedDateAnswer.value = card.value.answer as DateAnswer
    card.value.answer = cachedSimpleAnswer.value
  }
}
</script>
<template>
  <div class="card-fields">
    <DateCardField v-if="answerIsADate" v-model="card as DateCard" />
    <SimpleCardField v-else v-model="card as SimpleCard" />
    <label
      class="checkbox-label"
      v-if="dateDetectedInStringAnswer || answerIsADate || cachedDateAnswer?.time"
    >
      <input type="checkbox" :checked="answerIsADate" @change="toggleDate" />
      <span class="checkbox-text">
        Cette réponse est une date
        <template v-if="dateDetectedInStringAnswer && !answerIsADate && !cachedDateAnswer?.time">
          (<span v-html="toReadableTimeMarker(dateDetectedInStringAnswer.marker)"></span>) :
          {{ getEventName(card.question) }}
        </template>
      </span>
    </label>
  </div>
</template>
<style>
.card-fields input,
.card-fields textarea {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1px solid #ded4c7;
  border-radius: 8px;
  background-color: #fffdf8;
  color: #2a2b2f;
  font-family: Georgia, 'Times New Roman', Times, serif;
  font-size: 15px;
  line-height: 1.5;
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease,
    background-color 150ms ease;
}

.card-fields input::placeholder,
.card-fields textarea::placeholder {
  color: #aaa198;
}

.card-fields input:focus,
.card-fields textarea:focus {
  border-color: #b05a36;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgb(176 90 54 / 12%);
}

.card-fields textarea {
  min-height: 100px;
  resize: vertical;
}

.card-fields .field-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-fields .preview-toggle {
  padding: 12px 8px;
  border: 1px solid #e3d8cb;
  border-radius: 6px;
  background-color: #fffdf8;
  color: #8f4a2e;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.card-fields .preview-toggle:hover {
  border-color: #c99b83;
  background-color: #f3e5d9;
}

.card-fields .markdown-preview {
  box-sizing: border-box;
  width: 100%;
  min-height: 100px;
  padding: 12px 14px;
  border: 1px solid #ded4c7;
  border-radius: 8px;
  background-color: #fffdf8;
  color: #2a2b2f;
  overflow-wrap: anywhere;
}

.card-fields .markdown-preview :deep(:first-child) {
  margin-top: 0;
}

.card-fields .markdown-preview :deep(:last-child) {
  margin-bottom: 0;
}

.card-fields .markdown-preview :deep(pre) {
  overflow-x: auto;
  padding: 10px;
  border-radius: 6px;
  background: #f1e7dc;
}

.card-fields .markdown-preview :deep(code) {
  overflow-wrap: anywhere;
}

.card-fields .markdown-preview :deep(img) {
  max-width: 100%;
}
.card-fields input[type='checkbox'] {
  display: inline-block;
  width: auto;
  margin: 0;
  padding: 0;
  accent-color: #b05a36;
}

.card-fields .checkbox-label {
  display: flex;
  align-items: flex-start; /* keeps the checkbox on the first line if the text wraps */
  gap: 0.5em;
}

.card-fields .checkbox-label input[type='checkbox'] {
  margin: 0.25em 0 0; /* tweak to align with the first text line */
}

.card-fields .checkbox-text sup {
  font-size: 0.75em;
  line-height: 0;
  vertical-align: baseline;
  position: relative;
  top: -0.5em;
}
</style>
