<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <header>
    <a href="/">Flashcards</a>
  </header>
  <main>
    <RouterView />
  </main>
</template>

<style>
main {
  padding: 20px;
  max-width: 800px;
  margin: auto;
}

* {
  font-family: Georgia, 'Times New Roman', Times, serif;
}

body {
  background-color: #fef9ef;
  color: #2a2b2f;
}

header {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

header > a {
  text-decoration: none;
  font-size: 2.5rem;
  color: #b05a36;
  font-family: Georgia, 'Times New Roman', Times, serif;
}
</style>
