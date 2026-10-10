<script setup lang="ts">
import DeckList from '../components/DeckList.vue'
import { useAuth } from '../composables/useAuth'

const { user, signOut } = useAuth()
</script>

<template>
  <main>
    <p>Connecté en tant que {{ user?.email }}</p>
    <a href="/new-deck">Nouveau jeu de cartes</a>
    <DeckList target-base-url="/edit-deck/" :show-archive-button="true" />

    <button @click="signOut">Déconnexion</button>
  </main>
</template>
<style></style>
