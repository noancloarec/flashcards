<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const { signIn } = useAuth()
const route = useRoute()
const router = useRouter()

const error = ref<string | null>(null)
const submitting = ref(false)

async function handleSignIn() {
  error.value = null
  submitting.value = true

  try {
    await signIn()
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/admin'
    await router.replace(redirect)
  } catch (err) {
    if ((err as { code?: string }).code !== 'auth/popup-closed-by-user') {
      error.value = err instanceof Error ? err.message : String(err)
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main>
    <h1>Connexion</h1>

    <button :disabled="submitting" @click="handleSignIn">Connexion avec Google</button>

    <p v-if="error">{{ error }}</p>
  </main>
</template>
