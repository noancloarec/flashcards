import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue'

export enum SavingStatus {
  NotSaved = 'notsaved',
  Saving = 'saving',
  Saved = 'saved'
}

/**
 * Provides a variable indicating wether the watched element should be saved
 * Prevent tab close if the element has not been saved
 * @param watchedElement the element the user should save
 * @returns the saving status
 */
export const useSavingStatus = <T>(watchedElement: Ref<T>) => {
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
    watchedElement,
    (_, previous) => {
      console.log(JSON.parse(JSON.stringify(previous)))
      if (previous === null) {
        return
      }
      if (typeof previous === 'object' && Object.keys(previous as object).length === 0) {
        return
      }

      elementSavingStatus.value = SavingStatus.NotSaved
    },
    { deep: true }
  )

  return {
    elementSavingStatus
  }
}
