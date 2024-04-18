const fs = require("fs")
var admin = require("firebase-admin");
var firestore = require("firebase-admin/firestore")

// var serviceAccount = require("./flashcards-c1e39-firebase-adminsdk-zrpr0-d55bee912b.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });



/**
 * Add the decks in the provided json file to firestore
 * @param {string} decksJsonFile json file containing an array of decks
 */
const addDecksToFirestore = (decksJsonFile) => {
    // const store = firestore.getFirestore()
    const decks = JSON.parse(fs.readFileSync(decksJsonFile))
    console.log(decks)
    for(const deck of decks){
        deck.author = "Noan Cloarec"
        addDeckToFireStore(deck, store)
    }
}

/**
 * Register one deck to firestore
 * @param {import("@/utils/cards").Deck} deck 
 * @param {firestore.Firestore} store
*/
const addDeckToFireStore = (deck, store) => {
    // TODO remove id from deck

    const deckReference = store.collection("deck").doc()
    deckReference.update(deck)

    const deckMetadata = {
        id : deckReference.id,
        author : deck.author,
        name : deck.name,
    }
    store.collection("deck_metadata").doc(deckReference.id).set(deckMetadata)    
}

addDecksToFirestore("../src/assets/data.json")