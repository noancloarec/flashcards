<script setup lang="ts">
import type { Card } from '../models/card'
import type { FunctionalDeck } from '../models/deck'

const deck = defineModel<FunctionalDeck>({ required: true })

const moveUp = (card: Card) => {
  const cards = deck.value.cards
  const index = cards.indexOf(card)

  if (index <= 0) return

  ;[cards[index - 1], cards[index]] = [cards[index], cards[index - 1]]
}

const moveDown = (card: Card) => {
  const cards = deck.value.cards
  const index = cards.indexOf(card)

  if (index >= cards.length - 1) return

  ;[cards[index + 1], cards[index]] = [cards[index], cards[index + 1]]
}

const newCard = () => {
  deck.value.cards.push({
    question: '',
    answer: '',
    id: crypto.randomUUID(),
    successfulAttempts: [],
    failedAttempts: []
  })
}

const deleteCard = (card: Card) => {
  const index = deck.value.cards.indexOf(card)

  if (index === -1) return

  deck.value.cards.splice(index, 1)
}
</script>

<template>
  <form class="deck-form" @submit.prevent>
    <div class="form-header">
      <div class="form-header-icon">✎</div>

      <div>
        <h1>Modifier le jeu de cartes</h1>
        <p>Organisez vos cartes et modifiez leur contenu.</p>
      </div>
    </div>

    <section class="deck-info">
      <div class="section-heading">
        <span class="section-number">01</span>

        <div>
          <h2>Informations générales</h2>
          <p>Donnez un nom à votre jeu de cartes.</p>
        </div>
      </div>

      <div class="field">
        <label for="deck-name">Nom du jeu</label>

        <input
          id="deck-name"
          v-model="deck.name"
          type="text"
          placeholder="Ex. Histoire de France"
        />
      </div>
    </section>

    <section class="cards-section">
      <div class="cards-header">
        <div class="section-heading">
          <span class="section-number">02</span>

          <div>
            <h2>Vos cartes</h2>
            <p>Ajoutez des questions et leurs réponses.</p>
          </div>
        </div>

        <span class="card-count">
          {{ deck.cards.length }}
          {{ deck.cards.length > 1 ? 'cartes' : 'carte' }}
        </span>
      </div>

      <div v-if="deck.cards.length === 0" class="empty-state">
        <div class="empty-icon">▤</div>
        <h3>Aucune carte pour le moment</h3>
        <p>Commencez par ajouter votre première question.</p>

        <button type="button" class="add-card-button" @click="newCard">
          <span class="button-icon">+</span>
          Ajouter une carte
        </button>
      </div>

      <div v-else class="cards-list">
        <article
          v-for="(card, index) in deck.cards"
          :key="card.id"
          :id="card.id"
          class="card-editor"
        >
          <div class="card-editor-header">
            <div class="card-actions">
              <button
                type="button"
                class="icon-button move-button"
                :disabled="index === 0"
                :aria-label="`Déplacer la carte ${index + 1} vers le haut`"
                title="Déplacer vers le haut"
                @click="moveUp(card)"
              >
                ↑
              </button>

              <button
                type="button"
                class="icon-button move-button"
                :disabled="index === deck.cards.length - 1"
                :aria-label="`Déplacer la carte ${index + 1} vers le bas`"
                title="Déplacer vers le bas"
                @click="moveDown(card)"
              >
                ↓
              </button>

              <button
                type="button"
                class="icon-button delete-button"
                :aria-label="`Supprimer la carte ${index + 1}`"
                title="Supprimer cette carte"
                @click="deleteCard(card)"
              >
                ×
              </button>
            </div>
          </div>
          <div class="card-fields">
            <div class="field">
              <label :for="`question-${card.id}`">Question</label>

              <textarea
                :id="`question-${card.id}`"
                v-model="card.question"
                placeholder="Ex. En quelle année a eu lieu la bataille de Marignan ?"
                rows="3"
              ></textarea>
            </div>

            <div class="field">
              <label :for="`answer-${card.id}`">Réponse</label>

              <textarea
                :id="`answer-${card.id}`"
                v-model="card.answer"
                placeholder="Ex. En 1515."
                rows="3"
              ></textarea>
            </div>
          </div>
        </article>
      </div>

      <button
        v-if="deck.cards.length > 0"
        type="button"
        class="add-card-button add-card-bottom"
        @click="newCard"
      >
        <span class="button-icon">+</span>
        Ajouter une carte
      </button>
    </section>

    <div class="form-footer">
      <p>
        {{ deck.cards.length }}
        {{ deck.cards.length > 1 ? 'cartes au total' : 'carte au total' }}
      </p>

      <span class="footer-hint"> Les modifications sont appliquées au jeu en cours. </span>
    </div>
  </form>
</template>

<style scoped>
.deck-form {
  display: flex;
  flex-direction: column;
  gap: 28px;
  margin: 30px auto;
  width: 100%;
  max-width: 800px;
}

/* En-tête */

.form-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e8dfd2;
}

.form-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 54px;
  height: 54px;
  border-radius: 14px;
  background-color: #f3e5d9;
  color: #b05a36;
  font-size: 28px;
}

.form-header h1 {
  margin: 0 0 6px;
  color: #2a2b2f;
  font-size: 26px;
  line-height: 1.3;
}

.form-header p {
  margin: 0;
  color: #77716b;
  font-size: 14px;
  line-height: 1.5;
}

/* Sections */

.deck-info,
.cards-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 13px;
}

.section-number {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border: 1px solid #e5d6c5;
  border-radius: 10px;
  color: #b05a36;
  background-color: #fffdf8;
  font-size: 12px;
  font-weight: bold;
}

.section-heading h2 {
  margin: 0 0 4px;
  color: #2a2b2f;
  font-size: 18px;
}

.section-heading p {
  margin: 0;
  color: #77716b;
  font-size: 13px;
  line-height: 1.5;
}

/* Champs */

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.field label {
  color: #45413d;
  font-size: 14px;
  font-weight: bold;
}

.deck-form input,
.deck-form textarea {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1px solid #ded4c7;
  border-radius: 8px;
  background-color: #fffdf8;
  color: #2a2b2f;
  font-family: Georgia, 'Times New Roman', Times, serif;
  font-size: 15px;
  line-height: 1.5;
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease,
    background-color 150ms ease;
}

.deck-form input::placeholder,
.deck-form textarea::placeholder {
  color: #aaa198;
}

.deck-form input:focus,
.deck-form textarea:focus {
  outline: none;
  border-color: #b05a36;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgb(176 90 54 / 12%);
}

.deck-form textarea {
  min-height: 100px;
  resize: vertical;
}

/* En-tête de la liste de cartes */

.cards-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.card-count {
  flex-shrink: 0;
  padding: 7px 12px;
  border-radius: 20px;
  background-color: #f1e7dc;
  color: #8f4a2e;
  font-size: 12px;
  font-weight: bold;
}

/* Éditeur de carte */

.cards-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.card-editor {
  overflow: hidden;
  border: 1px solid #e5dbcf;
  border-radius: 12px;
  background-color: #fffdf8;
  box-shadow: 0 3px 10px rgb(64 43 25 / 3%);
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease;
}

.card-editor:focus-within {
  border-color: #c99b83;
  box-shadow: 0 4px 16px rgb(64 43 25 / 6%);
}

.card-editor-header {
  display: flex;
  justify-content: flex-end;
  padding: 10px 14px;
  border-bottom: 1px solid #eee5da;
  background-color: #faf5ed;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.card-index {
  color: #b05a36;
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 0.5px;
}

.card-title h3 {
  margin: 0;
  color: #37332f;
  font-size: 15px;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.deck-form .icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  min-width: 34px;
  height: 34px;
  min-height: 34px;
  padding: 0;
  border: 1px solid #e3d8cb;
  border-radius: 7px;
  background-color: #fffdf8;
  color: #655b51;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition:
    background-color 150ms ease,
    border-color 150ms ease,
    color 150ms ease;
}

.deck-form .move-button:hover:not(:disabled) {
  border-color: #c99b83;
  background-color: #f3e5d9;
  color: #8f4a2e;
}

.deck-form .icon-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.deck-form .delete-button {
  margin-left: 4px;
  color: #a64d3c;
  font-size: 25px;
}

.deck-form .delete-button:hover {
  border-color: #dca99e;
  background-color: #f8e5df;
  color: #8d3024;
}

.card-fields {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 18px;
}

/* Bouton d'ajout */

.deck-form .add-card-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: flex-start;
  gap: 9px;
  min-height: 44px;
  padding: 10px 16px;
  border: 1px dashed #c99b83;
  border-radius: 8px;
  background-color: #f8eee4;
  color: #8f4a2e;
  font-family: inherit;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition:
    background-color 150ms ease,
    border-color 150ms ease,
    transform 150ms ease;
}

.deck-form .add-card-button:hover {
  border-color: #b05a36;
  background-color: #f1dfcf;
}

.deck-form .add-card-button:active {
  transform: translateY(1px);
}

.button-icon {
  font-size: 21px;
  line-height: 1;
}

.add-card-bottom {
  margin-top: 2px;
}

/* État vide */

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 38px 20px;
  border: 1px dashed #d9cabb;
  border-radius: 12px;
  background-color: rgb(255 253 248 / 65%);
  text-align: center;
}

.empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  margin-bottom: 14px;
  border-radius: 14px;
  background-color: #f3e5d9;
  color: #b05a36;
  font-size: 28px;
}

.empty-state h3 {
  margin: 0 0 8px;
  color: #37332f;
  font-size: 17px;
}

.empty-state p {
  margin: 0 0 20px;
  color: #77716b;
  font-size: 14px;
  line-height: 1.5;
}

/* Pied du formulaire */

.form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 18px;
  border-top: 1px solid #e8dfd2;
}

.form-footer p {
  margin: 0;
  color: #655b51;
  font-size: 13px;
  font-weight: bold;
}

.footer-hint {
  color: #888078;
  font-size: 12px;
}

/* Accessibilité */

.deck-form button:focus-visible {
  outline: 2px solid #b05a36;
  outline-offset: 3px;
}

/* Responsive */

@media (max-width: 600px) {
  .deck-form {
    gap: 24px;
    margin-top: 20px;
  }

  .form-header {
    align-items: flex-start;
    gap: 12px;
  }

  .form-header-icon {
    width: 44px;
    height: 44px;
    border-radius: 11px;
    font-size: 24px;
  }

  .form-header h1 {
    font-size: 21px;
  }

  .section-heading h2 {
    font-size: 16px;
  }

  .cards-header {
    align-items: flex-start;
  }

  .card-count {
    padding: 6px 9px;
    font-size: 11px;
  }

  .card-editor-header {
    padding: 12px;
  }

  .card-fields {
    padding: 14px;
  }

  .deck-form .icon-button {
    width: 32px;
    min-width: 32px;
    height: 32px;
    min-height: 32px;
  }

  .form-footer {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
