<script setup>
import { onMounted, ref } from 'vue'
import DeckList from '../components/DeckList.vue'
import { useAuth } from '../composables/useAuth.ts'
const { getUserId } = useAuth()
const userId = ref('')
onMounted(async () => {
  userId.value = await getUserId()
})
</script>

<template>
  <main>
    <DeckList target-base-url="/memorize/" />
    <p>Connecté en tant que {{ userId }}</p>
  </main>
</template>
