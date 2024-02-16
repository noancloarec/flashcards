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
  font-family: "Haas Grot Text R Web", "Helvetica Neue", Helvetica, Arial, sans-serif;

}

header {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

header>a {
  text-decoration: none;
  font-size: 2rem;
  color: #673AB7;
  font-weight: 600;
}
</style>