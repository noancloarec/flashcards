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
 * Create or update one deck.
 * - No `id` in the JSON  -> new document (auto id, createdAt = now)
 * - `id` in the JSON     -> document is fully replaced with the JSON content
 *                           (createdAt is preserved)
 * @returns {Promise<{ id: string, action: 'created' | 'updated' }>}
 */
const upsertDeck = async (deck, store) => {
  const { id, createdAt, ...data } = deck // id is the doc key, not a field

  if (!id) {
    const ref = store.collection('deck').doc()
    await ref.create({ ...data, createdAt: firestore.FieldValue.serverTimestamp() })
    return { id: ref.id, action: 'created' }
  }

  const ref = store.collection('deck').doc(id)
  const snap = await ref.get()

  // The JSON holds createdAt as an ISO string (see downloadAllDecks): convert it back.
  const resolvedCreatedAt = createdAt
    ? firestore.Timestamp.fromDate(new Date(createdAt))
    : (snap.get('createdAt') ?? firestore.FieldValue.serverTimestamp())

  // set() without merge = full replace, so fields you removed from the JSON
  // (e.g. an old data-model field) are removed in Firestore too.
  await ref.set({ ...data, createdAt: resolvedCreatedAt })

  return { id, action: snap.exists ? 'updated' : 'created' }
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
  const writtenPaths = new Map() // deck id -> output path

  for (const doc of snapshot.docs) {
    const deck = doc.data()

    const filename =
      (deck.name || doc.id)
        .normalize('NFKD') // compatibility decomposition: ᵉ -> e, ﬁ -> fi, etc.
        .replace(/[\u0300-\u036f]/g, '') // strip combining accents
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_') // whitelist: anything else becomes _
        .replace(/^_+|_+$/g, '') // trim leading/trailing _
        .slice(0, 100) || // optional: keep filenames a reasonable length
      doc.id

    const serializedDeck = {
      ...deck,
      createdAt: deck.createdAt?.toDate?.().toISOString() ?? null,
      id: doc.id
    }

    const outputPath = path.join(outputDir, `${filename}.json`)

    fs.writeFileSync(outputPath, JSON.stringify(sortObjectKeys(serializedDeck), null, 2))
    writtenPaths.set(doc.id, outputPath)
    console.log(`Downloaded: ${outputPath}`)
  }

  console.log(`Downloaded ${snapshot.size} deck(s) to "${outputDir}".`)
  reportLocalDiscrepancies(outputDir, writtenPaths)
}

/**
 * Compare the JSON files in the output folder with what was just downloaded
 * from Firestore, and report the discrepancies. Nothing is deleted.
 * @param {string} outputDir
 * @param {Map<string, string>} writtenPaths deck id -> path written during this run
 */
const reportLocalDiscrepancies = (outputDir, writtenPaths) => {
  const orphans = [] // id not in Firestore (deleted from the DB, or wrong id)
  const stale = [] // id exists in Firestore but under another filename (deck renamed)
  const withoutId = [] // never uploaded yet
  const invalid = [] // not parseable as JSON

  const files = fs.readdirSync(outputDir).filter((f) => f.endsWith('.json'))

  for (const file of files) {
    const filePath = path.join(outputDir, file)

    let json
    try {
      json = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    } catch {
      invalid.push(filePath)
      continue
    }

    if (!json.id) {
      withoutId.push(filePath)
      continue
    }

    const writtenPath = writtenPaths.get(json.id)
    if (!writtenPath) {
      orphans.push({ filePath, id: json.id, name: json.name })
    } else if (path.resolve(writtenPath) !== path.resolve(filePath)) {
      stale.push({ filePath, id: json.id, current: writtenPath })
    }
  }

  if (orphans.length > 0) {
    console.warn(`\n⚠ ${orphans.length} local file(s) with an id that does NOT exist in Firestore:`)
    for (const o of orphans) console.warn(`  - ${o.filePath} (id: ${o.id}, name: "${o.name}")`)
    console.warn('  Uploading them again would re-create these decks under the same id.')
  }

  if (stale.length > 0) {
    console.warn(
      `\n⚠ ${stale.length} outdated duplicate(s) (deck renamed, same id in a newer file):`
    )
    for (const s of stale) console.warn(`  - ${s.filePath} -> now ${s.current}`)
  }

  if (withoutId.length > 0) {
    console.log(`\nℹ ${withoutId.length} local file(s) without an id (not uploaded yet):`)
    for (const f of withoutId) console.log(`  - ${f}`)
  }

  if (invalid.length > 0) {
    console.warn(`\n⚠ ${invalid.length} file(s) could not be parsed as JSON:`)
    for (const f of invalid) console.warn(`  - ${f}`)
  }

  if (!orphans.length && !stale.length && !withoutId.length && !invalid.length) {
    console.log('\nLocal folder is in sync with Firestore.')
  }
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
    console.log(`Processing ${input}...`)

    const deck = JSON.parse(fs.readFileSync(input, 'utf8'))

    for (const card of deck.cards) {
      if (!card.id) {
        card.id = crypto.randomUUID()
      }
    }

    const { id, action } = await upsertDeck(deck, store)
    console.log(`  ${action}: deck/${id}`)

    // Write the id back into the file so re-running updates instead of duplicating
    if (!deck.id) {
      deck.id = id
      fs.writeFileSync(input, JSON.stringify(sortObjectKeys(deck), null, 2))
    }
  }

  console.log(`Processed ${inputs.length} deck(s).`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
