const fs = require('fs')
const admin = require('firebase-admin')
const firestore = require('firebase-admin/firestore')
const serviceAccount = require('./service_account_key.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

/**
 * Register one deck to firestore
 * @param {import("@/utils/cards").Deck} deck
 * @param {firestore.Firestore} store
 */
const addDeckToFirestore = async (deck, store) => {
  const deckReference = store.collection('deck').doc()
  deck = { ...deck, createdAt: firestore.FieldValue.serverTimestamp() }
  await deckReference.create(deck)
}

const main = async () => {
  const inputs = process.argv.slice(2)

  if (inputs.length === 0) {
    console.error('Usage:')
    console.error('  node index.js <deck.json> [deck2.json ...]')
    console.error('  node index.js data/*.json')
    process.exit(1)
  }

  const store = firestore.getFirestore()

  for (const input of inputs) {
    console.log(`Adding deck from ${input}...`)

    const deck = JSON.parse(fs.readFileSync(input))
    for (const card of deck.cards) {
      card.id = crypto.randomUUID()
    }
    await addDeckToFirestore(deck, store)
  }

  console.log(`Added ${inputs.length} deck(s).`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
