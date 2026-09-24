const fs = require("fs")
const admin = require("firebase-admin")
const firestore = require("firebase-admin/firestore")
const serviceAccount = require("./service_account_key.json")

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})


/**
 * Register one deck to firestore
 * @param {import("@/utils/cards").Deck} deck
 * @param {firestore.Firestore} store
 */
const addDeckToFirestore = async (deck, store) => {
    const { id: _, ...deckWithoutId } = deck

    const deckReference = store.collection("deck").doc()

    await deckReference.create(deckWithoutId)

    await store
        .collection("deck_metadata")
        .doc(deckReference.id)
        .set(deckWithoutId)
}

/**
 * Delete all documents from a Firestore collection.
 * @param {firestore.CollectionReference} collection
 */
const clearCollection = async (collection) => {
    const snapshot = await collection.get()
    const batch = collection.firestore.batch()

    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref)
    })

    await batch.commit()
}

/**
 * Delete all decks and their metadata.
 */
const clearDatabase = async () => {
    const store = firestore.getFirestore()

    console.log("Clearing deck collection...")
    await clearCollection(store.collection("deck"))

    console.log("Clearing deck_metadata collection...")
    await clearCollection(store.collection("deck_metadata"))

    console.log("Database cleared.")
}

const main = async () => {
    const inputs = process.argv.slice(2)

    if (inputs.includes("--clear-db")) {
        await clearDatabase()
        return
    }

    if (inputs.length === 0) {
        console.error("Usage:")
        console.error("  node index.js <deck.json> [deck2.json ...]")
        console.error("  node index.js data/*.json")
        console.error("  node index.js --clear-db")
        process.exit(1)
    }

    const store = firestore.getFirestore()

    for (const input of inputs) {
        console.log(`Adding deck from ${input}...`)

        const deck = JSON.parse(fs.readFileSync(input))
        await addDeckToFirestore(deck, store)
    }

    console.log(`Added ${inputs.length} deck(s).`)
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})