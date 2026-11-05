<script setup lang="ts">
defineProps<{
  fixed?: boolean
}>()
</script>

<template>
  <div :class="['toolbar', { 'toolbar--fixed': fixed }]">
    <slot />
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  box-sizing: border-box;
}

.toolbar--fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  padding: 1rem;
  box-shadow: 0 -2px 8px rgb(0 0 0 / 10%);
  z-index: 1000;
  background-color: #fef9ef;
}
:deep(main:has(.toolbar--fixed)) {
  padding-bottom: 5rem;
}
</style>
