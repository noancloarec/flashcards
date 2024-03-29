<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import decks from '../assets/data.json';
import { CardState, getCardState } from '../utils/cards';
import MemorizationProgress from './MemorizationProgress.vue';

const getInitialDeck = () => {
    const deckId = useRoute().params.deckId
    const deck = decks.find(deck => deck.id === deckId)
    return { ...deck, cards: deck.cards.map(card => ({ ...card, successfulAttempts: [], failedAttempts: [] })) }
}

const deckState = ref(getInitialDeck());
const currentCardIndex = ref(0)
const showAnswer = ref(false)


const getNextIndex = (currentIndex, cards) => {
    let i = currentIndex
    do {
        i = (i + 1) % cards.length
        if (getCardState(cards[i]) !== CardState.Learned) {
            return i
        }
    } while (i !== currentIndex)
    return -1
}

const cardToDisplay = computed(() => {
    return deckState.value.cards[currentCardIndex.value]
})

const nextQuestion = (success) => {
    showAnswer.value = false
    if (success) {
        deckState.value.cards[currentCardIndex.value].successfulAttempts.unshift(Date.now())
    } else {
        deckState.value.cards[currentCardIndex.value].failedAttempts.unshift(Date.now())
    }
    currentCardIndex.value = getNextIndex(currentCardIndex.value, deckState.value.cards)
}


</script>

<template>
    <div v-if="currentCardIndex !== -1">
        <div class="question" :class="{ reduced: showAnswer }">
            {{ cardToDisplay.question }}
        </div>
        <div class="answer" :class="{ shown: showAnswer }">
            {{ cardToDisplay.answer }}
        </div>
        <div class="actions">
            <button v-if="!showAnswer" @click="showAnswer = true" class="show-anwser">
                Show Answer
            </button>

            <template v-else>
                <button @click="nextQuestion(true)" class="success">
                    Got it
                </button>
                <button @click="nextQuestion(false)" class="failed">
                    Failed
                </button>
            </template>
        </div>

    </div>
    <div v-else>
        <p>
            You have learned all the cards in this deck!
        </p>
    </div>
    <MemorizationProgress :cards="deckState.cards" :current-card-index="currentCardIndex"
        @index-change="i => { showAnswer = false; currentCardIndex = i }" />
</template>

<style scoped>
.answer {
    opacity: 0;
    height: 0px;
    color: #340a3c00;
}

.question {
    height: 420px;
}

.question.reduced {
    height: 200px;
    transition: height 0.5s, opacity .5s;
}

.answer.shown {
    height: 200px;
    opacity: 1;
    transition: height.5s, opacity 0.5s, margin-top .5s, color .2s .2s;
    margin-top: 20px;

}



.question,
.answer.shown {

    font-size: 2em;
    width: 90%;
    margin-left: auto;
    margin-right: auto;
    background-color: #dbabef;
    border-radius: 20px;
    vertical-align: middle;
    line-height: 30px;
    flex-direction: row;
    align-items: center;
    display: flex;
    justify-content: center;
    padding: 0 20px;
    text-align: center;
    color: #340a3c;
}

.actions {
    display: flex;
    justify-content: space-evenly;
    margin: auto;
    padding: 10px;
    max-width: 300px;
}

.actions>button {
    border-radius: 8px;
    border-style: none;
    box-sizing: border-box;
    color: #FFFFFF;
    cursor: pointer;
    display: inline-block;
    font-size: 14px;
    font-weight: 500;
    height: 40px;
    line-height: 20px;
    list-style: none;
    margin: 0;
    outline: none;
    padding: 10px 16px;
    position: relative;
    text-align: center;
    text-decoration: none;
    transition: color 100ms;
    vertical-align: baseline;
    touch-action: manipulation;
}

button.show-anwser,
button.success {
    background-color: #b46ec0;
}

button.show-anwser:hover,
button.show-anwser:focus,
button.success:hover,
button.success:focus {
    background-color: #db5df1;
}

button.failed {
    background-color: #aa193b;
}

button.failed:hover,
button.failed:focus {
    background-color: #bc255e;
}
</style>