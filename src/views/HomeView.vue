<script setup>
import { onMounted, ref } from 'vue'
import DeckList from '../components/DeckList.vue'
import { useAuth } from '../composables/useAuth.ts'
const { googleUser, signOut } = useAuth()
</script>

<template>
  <main>
    <DeckList target-base-url="/memorize/" />
    <div v-if="googleUser">
      <p>Connecté en tant que {{ googleUser.email }}.</p>
      <p>
        <a href="" @click="signOut">Déconnexion</a>
      </p>
      <p>
        <a href="/admin">Administration</a>
      </p>
    </div>
    <p v-else>Non connecté. <a href="/login">Connexion</a></p>
  </main>
</template>
