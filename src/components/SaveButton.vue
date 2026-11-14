<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

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

const onKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault()
    save()
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', warnNoUnsavedChanges)
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', warnNoUnsavedChanges)
  window.removeEventListener('keydown', onKeydown)
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
