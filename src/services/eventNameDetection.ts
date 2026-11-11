const PRONOUN = '(?:il|elle|ils|elles)'
const ARTICLE = /^(?:l['’]|(?:la|le|les|un|une|des)\s+)/i

const RULES: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  // "Quand a lieu la bataille de Cannes" -> "bataille de Cannes"
  [/^Quand (?:a|ont) lieu (.+)$/i, (m) => m[1]],

  // "Quand la révolte de Spartacus a-t-elle lieu" -> "révolte de Spartacus"
  [new RegExp(`^Quand (.+?) (?:a|ont)-t-${PRONOUN} lieu$`, 'i'), (m) => m[1]],

  // "Quand est adoptée la loi Ogulnia" -> "loi Ogulnia"
  [/^Quand (?:est|sont) \p{L}+ (.+)$/iu, (m) => m[1]],

  // "Quand débute la République romaine" -> "République romaine"
  [/^Quand (?:débute|commence|a débuté|a commencé) (.+)$/i, (m) => m[1]],

  // "Quand la loi des Douze Tables est-elle rédigée" -> "loi des Douze Tables rédigée"
  // "Quand César est-il édile" -> "César édile"
  [new RegExp(`^Quand (.+?) (?:est|sont)-${PRONOUN} (.+)$`, 'i'), (m) => `${m[1]} ${m[2]}`],

  // "Quand Rome proclame-t-elle la liberté du monde grec" -> "Rome proclame la liberté du monde grec"
  // "Quand Rome prend-elle Tarente" -> "Rome prend Tarente"
  [
    new RegExp(`^Quand (.+?) (\\p{L}+)-(?:t-)?${PRONOUN} (.+)$`, 'iu'),
    (m) => `${m[1]} ${m[2]} ${m[3]}`
  ],

  // Any other "Quand ..." leftovers
  [/^Quand (.+)$/i, (m) => m[1]]
]

const finalize = (s: string): string => {
  const cleaned = s
    .replace(/\s+/g, ' ')
    .replace(/[,\s]+$/, '')
    .trim()
    .replace(ARTICLE, '')
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

/**
 * Tries to detect an event name from the question
 * Helps the user to fill the date answer
 * @param question the question on the card
 * @returns if possible, the event name
 */
export const getEventName = (question: string): string => {
  const q = question
    .replace(/\s+/g, ' ')
    .replace(/\s*\?\s*$/, '')
    .trim()

  // No event in the question (e.g. "Que se passe-t-il en 218 av. J.-C. ?")
  if (/^Que se passe-t-il/i.test(q)) return ''

  for (const [regex, build] of RULES) {
    const m = q.match(regex)
    if (m) return finalize(build(m))
  }
  return ''
}
