const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const admin = require('firebase-admin')
const firestore = require('firebase-admin/firestore')
const serviceAccount = require('./service_account_key.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

/**
 * Register one deck to Firestore.
 * @param {import("@/utils/cards").Deck} deck
 * @param {firestore.Firestore} store
 */
const addDeckToFirestore = async (deck, store) => {
  const deckReference = store.collection('deck').doc()
  deck = { ...deck, createdAt: firestore.FieldValue.serverTimestamp() }
  await deckReference.create(deck)
}

/**
 * Recursively sort object keys alphabetically.
 * Arrays preserve their original order.
 */
const sortObjectKeys = (value) => {
  if (Array.isArray(value)) {
    return value.map(sortObjectKeys)
  }

  if (value !== null && typeof value === 'object') {
    return Object.keys(value)
      .sort((a, b) => a.localeCompare(b))
      .reduce((sorted, key) => {
        sorted[key] = sortObjectKeys(value[key])
        return sorted
      }, {})
  }

  return value
}

/**
 * Recursively convert Firestore-specific types into JSON-friendly values.
 */
const serializeValue = (value) => {
  if (value instanceof firestore.Timestamp) return value.toDate().toISOString()
  if (value instanceof firestore.GeoPoint) {
    return { latitude: value.latitude, longitude: value.longitude }
  }
  if (value instanceof firestore.DocumentReference) return value.path
  if (Array.isArray(value)) return value.map(serializeValue)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, serializeValue(v)]))
  }
  return value
}

/**
 * Recursively dump a document: its fields plus all of its subcollections.
 * @param {firestore.DocumentReference} docRef
 */
const dumpDocument = async (docRef) => {
  const snap = await docRef.get()
  const result = {
    id: docRef.id,
    data: snap.exists ? serializeValue(snap.data()) : null
  }

  const subcollections = await docRef.listCollections()
  for (const sub of subcollections) {
    result[sub.id] = await dumpCollection(sub)
  }
  return result
}

/**
 * Recursively dump a collection as an array of documents.
 * @param {firestore.CollectionReference} colRef
 */
const dumpCollection = async (colRef) => {
  // listDocuments() also returns docs that have no fields but own subcollections
  const docRefs = await colRef.listDocuments()
  const docs = []
  for (const docRef of docRefs) {
    docs.push(await dumpDocument(docRef))
  }
  return docs
}

/**
 * Download /memorization_history including all subcollections (e.g. deck).
 * One JSON file per user document.
 * @param {firestore.Firestore} store
 * @param {string} outputDir
 */
const downloadMemorizationHistory = async (store, outputDir) => {
  console.log('Downloading memorization_history collection...')

  fs.mkdirSync(outputDir, { recursive: true })

  const docRefs = await store.collection('memorization_history').listDocuments()

  for (const docRef of docRefs) {
    const dumped = await dumpDocument(docRef)

    const filename = docRef.id.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_') || 'unknown'

    const outputPath = path.join(outputDir, `${filename}.json`)
    fs.writeFileSync(outputPath, JSON.stringify(sortObjectKeys(dumped), null, 2))
    console.log(`Downloaded: ${outputPath}`)
  }

  console.log(`Downloaded ${docRefs.length} user(s) to "${outputDir}".`)
}

/**
 * Download the entire deck collection from Firestore.
 * Each deck is saved as a separate JSON file.
 * Filenames are lowercase, without accents, and with spaces replaced by underscores.
 * @param {firestore.Firestore} store
 * @param {string} outputDir
 */
const downloadAllDecks = async (store, outputDir) => {
  console.log('Downloading deck collection...')

  fs.mkdirSync(outputDir, { recursive: true })

  const snapshot = await store.collection('deck').get()

  for (const doc of snapshot.docs) {
    const deck = doc.data()

    const filename =
      (deck.name || doc.id)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[-<>:"/\\|?*\x00-\x1F]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '') || doc.id

    const serializedDeck = {
      ...deck,
      createdAt: deck.createdAt?.toDate?.().toISOString() ?? null,
      id: doc.id
    }

    const outputPath = path.join(outputDir, `${filename}.json`)

    fs.writeFileSync(outputPath, JSON.stringify(sortObjectKeys(serializedDeck), null, 2))
    console.log(`Downloaded: ${outputPath}`)
  }

  console.log(`Downloaded ${snapshot.size} deck(s) to "${outputDir}".`)
}

const main = async () => {
  const inputs = process.argv.slice(2)
  const store = firestore.getFirestore()

  if (inputs[0] === '--download-all-decks') {
    const outputDir = inputs[1]

    if (!outputDir) {
      console.error('Usage: node index.js --download-all-decks <output-folder>')
      process.exit(1)
    }

    await downloadAllDecks(store, outputDir)
    return
  }

  if (inputs[0] === '--download-memorization-history') {
    const outputDir = inputs[1]

    if (!outputDir) {
      console.error('Usage: node index.js --download-memorization-history <output-folder>')
      process.exit(1)
    }

    await downloadMemorizationHistory(store, outputDir)
    return
  }

  if (inputs.length === 0) {
    console.error('Usage:')
    console.error('  node index.js <deck.json> [deck2.json ...]')
    console.error('  node index.js data/*.json')
    console.error('  node index.js --download-all-decks <output-folder>')
    process.exit(1)
  }

  for (const input of inputs) {
    console.log(`Adding deck from ${input}...`)

    const deck = JSON.parse(fs.readFileSync(input, 'utf8'))

    for (const card of deck.cards) {
      if (!card.id) {
        s
        card.id = crypto.randomUUID()
      }
    }

    await addDeckToFirestore(deck, store)
  }

  console.log(`Added ${inputs.length} deck(s).`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
