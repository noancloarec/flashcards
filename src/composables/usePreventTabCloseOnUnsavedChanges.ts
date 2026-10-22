import { onMounted, onUnmounted } from 'vue'
import { SavingStatus } from '../models/savingStatus'

export const usePreventTableCloseOnUnsavedChanges = (getSavingStatus: () => SavingStatus) => {
  const warnNoUnsavedChanges = (event: BeforeUnloadEvent) => {
    if (getSavingStatus() !== SavingStatus.Saved) {
      event.preventDefault()
    }
  }
  onMounted(() => {
    window.addEventListener('beforeunload', warnNoUnsavedChanges)
  })
  onUnmounted(() => {
    window.removeEventListener('beforeunload', warnNoUnsavedChanges)
  })
}
