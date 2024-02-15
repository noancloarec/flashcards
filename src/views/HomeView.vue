<script setup>
import QuestionList from '../components/QuestionList.vue'
import deck from '../assets/data.json'
</script>

<template>
  <main>
    <QuestionList :deck="deck" />
  </main>
</template>
