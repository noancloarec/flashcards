<script setup lang="ts">
withDefaults(defineProps<{ message?: string }>(), {
  message: 'Chargement ...'
})
</script>

<template>
  <div class="loading" role="status" aria-live="polite">
    <div class="spinner" aria-hidden="true" />
    <p>{{ message }}</p>
  </div>
</template>

<style scoped>
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 60vh;
  color: rgb(176, 97, 64);

  /* Invisible for the first 200 ms, so fast loads never flash a loader */
  opacity: 0;
  animation: fade-in 0.2s ease-out 0.2s forwards;
}

.spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 4px solid #f5eee1;
  border-top-color: rgb(176, 97, 64);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fade-in {
  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation-duration: 2.4s; /* slower, but still shows that something is happening */
  }
}
</style>
