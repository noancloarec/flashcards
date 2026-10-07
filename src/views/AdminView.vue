<script setup lang="ts">
import { useAuth } from '../composables/useAuth'

const { user, signOut } = useAuth()
</script>

<template>
  <main>
    <p>Connecté en tant que {{ user?.email }}</p>
    <a href="/new-deck">Nouveau jeu de cartes</a>

    <button @click="signOut">Déconnexion</button>
  </main>
</template>
