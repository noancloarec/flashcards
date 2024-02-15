<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <header>
    Header
  </header>
  <main>
    <RouterView />
  </main>
</template>

<style scoped>
main {
  padding: 20px;
  max-width: 800px;
  margin: auto;
}
</style>