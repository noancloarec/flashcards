<script setup lang="ts">
import { useAuth } from '../composables/useAuth.ts'
const { googleUser, signOut, loading } = useAuth()
</script>
<template>
  <div v-if="loading"></div>
  <div v-else-if="googleUser">
    <p>Connecté(e) en tant que {{ googleUser.email }}.</p>
    <p>
      <a href="" @click="signOut">Déconnexion</a>
    </p>
    <p>
      <a href="/admin">Administration</a>
    </p>
  </div>
  <p v-else>Non connecté. <a href="/login">Connexion</a></p>
</template>
