<script setup lang="ts">
import { ref } from 'vue'

import type { DateCard } from '../models/card'
import { renderMarkdown } from '../services/markdown'
import TimeMarkerField from './TimeMarkerField.vue'

const card = defineModel<DateCard>({ required: true })

const previewQuestionMarkdown = ref(false)
const previewDetailsMarkdown = ref(false)
</script>
<template>
  <div class="field">
    <div class="field-heading">
      <label :for="`question-${card.id}`">Question</label>
      <button
        type="button"
        class="preview-toggle"
        :aria-pressed="previewQuestionMarkdown"
        @click="previewQuestionMarkdown = !previewQuestionMarkdown"
      >
        {{ previewQuestionMarkdown ? 'Modifier' : 'Prévisualiser' }}
      </button>
    </div>

    <textarea
      v-if="!previewQuestionMarkdown"
      :id="`question-${card.id}`"
      v-model="card.question"
      placeholder="Ex. En quelle année a eu lieu la bataille de Marignan ?"
      rows="3"
    ></textarea>
    <div v-else class="markdown-preview" v-html="renderMarkdown(card.question)" />
  </div>

  <div class="field">
    <div class="field-heading">
      <label :for="`name-${card.id}`">Nom de l'événement</label>
    </div>
    <input
      :id="`name-${card.id}`"
      v-model="card.answer.name"
      type="text"
      required
      placeholder="Ex. Bataille de Marignan"
    />
  </div>

  <div class="field">
    <TimeMarkerField v-model="card.answer.time" />
  </div>

  <div class="field">
    <div class="field-heading">
      <label :for="`details-${card.id}`">Précisions (facultatif)</label>
      <button
        type="button"
        class="preview-toggle"
        :aria-pressed="previewDetailsMarkdown"
        @click="previewDetailsMarkdown = !previewDetailsMarkdown"
      >
        {{ previewDetailsMarkdown ? 'Modifier' : 'Prévisualiser' }}
      </button>
    </div>

    <textarea
      v-if="!previewDetailsMarkdown"
      :id="`details-${card.id}`"
      v-model="card.answer.details"
      placeholder="Ex. François Ier remporte la bataille."
      rows="3"
    ></textarea>
    <div v-else class="markdown-preview" v-html="renderMarkdown(card.answer.details ?? '')" />
  </div>
</template>
