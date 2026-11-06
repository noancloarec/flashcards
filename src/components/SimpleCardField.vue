<script setup lang="ts">
import { ref } from 'vue'

import type { SimpleCard } from '../models/card'
import { renderMarkdown } from '../services/markdown'

const card = defineModel<SimpleCard>({ required: true })

const previewQuestionMarkdown = ref(false)
const previewAnswerMarkdown = ref(false)
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
      <label :for="`answer-${card.id}`">Réponse</label>
      <button
        type="button"
        class="preview-toggle"
        :aria-pressed="previewAnswerMarkdown"
        @click="previewAnswerMarkdown = !previewAnswerMarkdown"
      >
        {{ previewAnswerMarkdown ? 'Modifier' : 'Prévisualiser' }}
      </button>
    </div>

    <textarea
      v-if="!previewAnswerMarkdown"
      :id="`answer-${card.id}`"
      v-model="card.answer"
      placeholder="Ex. En 1515."
      rows="3"
    ></textarea>
    <div v-else class="markdown-preview" v-html="renderMarkdown(card.answer)" />
  </div>
</template>
