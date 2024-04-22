// Import the functions you need from the SDKs you need
import { initializeApp  } from "firebase/app";
import { getFirestore } from "firebase/firestore";

/**
 * @typedef {Object} Card
 * @property {string} question
 * @property {string} answer the answer
 */

/**
 * @typedef {Object} Deck
 * @property {string} id
 * @property {string} name 
 * @property {string} author
 * @property {Array.<Card>} cards
 */

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBHPBl6MD-7vbGIkoyWwQZsE0GH1AOS3cM",
    authDomain: "flashcards-c1e39.firebaseapp.com",
    projectId: "flashcards-c1e39",
    storageBucket: "flashcards-c1e39.appspot.com",
    messagingSenderId: "289841998090",
    appId: "1:289841998090:web:630464da121449e2d872f3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const CardState = {
    Learned: Symbol('learned'),
    Notlearned: Symbol('notlearned'),
    NotTriedYet: Symbol('notTriedYet')
};

export const getCardState = (card) => {
    if (!card.successfulAttempts.length && !card.failedAttempts.length) {
        return CardState.NotTriedYet;
    } else if (!card.successfulAttempts.length || card.failedAttempts[0] > card.successfulAttempts[0]) {
        return CardState.Notlearned;
    } else {
        return CardState.Learned;
    }
}


