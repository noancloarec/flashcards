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
  flex-wrap: wrap;
  align-items: baseline; /* align the text itself, not the boxes */
  justify-content: space-between;
  gap: 0.5rem 1rem;
  width: 100%;
  box-sizing: border-box;
  line-height: 1.5; /* same line-height for p and a */
  margin-top: 50px;
}

.auth-bar p {
  margin: 0;
  padding: 0;
  min-width: 0;
  overflow-wrap: anywhere;
}

.auth-links {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem 1rem;
}

.auth-links a {
  margin: 0;
  padding: 0;
  line-height: inherit;
}

@media (max-width: 600px) {
  .auth-bar {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
