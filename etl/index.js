const fs = require("fs")
const admin = require("firebase-admin");
const firestore = require("firebase-admin/firestore")
const serviceAccount = require("./service_account_key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



/**
 * Add the decks in the provided json file to firestore
 * @param {string} decksJsonFile json file containing an array of decks
 */
const addDecksToFirestore = (decksJsonFile) => {
    const store = firestore.getFirestore()
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
    const {id:_, ...deckWithoutId} = deck

    const deckReference = store.collection("deck").doc()
    deckReference.create(deckWithoutId)


    store.collection("deck_metadata").doc(deckReference.id).set(deckWithoutId)    
}

const input = process.argv[2];

addDecksToFirestore(input)