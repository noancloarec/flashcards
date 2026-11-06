<script setup lang="ts">
import { useAuth } from '../composables/useAuth.ts'
const { googleUser, signOut, loading } = useAuth()
</script>

<template>
  <div v-if="loading"></div>

  <div v-else-if="googleUser" class="auth-bar">
    <p>Connecté(e) en tant que {{ googleUser.email }}.</p>
    <nav class="auth-links">
      <a href="/admin">Administration</a>
      <a href="#" @click.prevent="signOut">Déconnexion</a>
    </nav>
  </div>

  <p v-else>Non connecté. <a href="/login">Connexion</a></p>
</template>

<style scoped>
.auth-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  box-sizing: border-box;
}

.auth-links {
  display: flex;
  gap: 1rem;
}
</style>
