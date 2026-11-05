<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'

import { SavingStatus } from '../models/savingStatus'

const props = defineProps<{
  elementToWatch: object
  onSave: () => Promise<void>
}>()

const elementSavingStatus = ref(SavingStatus.Saved)

const warnNoUnsavedChanges = (event: BeforeUnloadEvent) => {
  if (elementSavingStatus.value !== SavingStatus.Saved) {
    event.preventDefault()
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', warnNoUnsavedChanges)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', warnNoUnsavedChanges)
})

watch(
  () => props.elementToWatch,
  (_, previous) => {
    if (previous === null) return

    if (typeof previous === 'object' && Object.keys(previous).length === 0) {
      return
    }

    elementSavingStatus.value = SavingStatus.NotSaved
  },
  { deep: true }
)

const save = async () => {
  if (elementSavingStatus.value !== SavingStatus.NotSaved) return

  elementSavingStatus.value = SavingStatus.Saving

  try {
    await props.onSave()
    elementSavingStatus.value = SavingStatus.Saved
  } catch (error) {
    elementSavingStatus.value = SavingStatus.NotSaved
    throw error
  }
}
</script>

<template>
  <button @click="save" :disabled="elementSavingStatus !== SavingStatus.NotSaved">
    <template v-if="elementSavingStatus === SavingStatus.NotSaved"> Sauvegarder </template>

    <template v-else-if="elementSavingStatus === SavingStatus.Saving"> Sauvegarde ... </template>

    <template v-else-if="elementSavingStatus === SavingStatus.Saved"> Sauvegardée ✅ </template>
  </button>
</template>
