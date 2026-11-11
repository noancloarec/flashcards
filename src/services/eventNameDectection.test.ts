import { describe, expect, it } from 'vitest'
import { getEventName } from './eventNameDetection'

describe('getEventName', () => {
  describe('«Quand a lieu …»', () => {
    it.each([
      ['Quand a lieu la bataille de Cannes ?', 'Bataille de Cannes'],
      ['Quand a lieu la bataille de Zama ?', 'Bataille de Zama'],
      ['Quand a lieu le traité de Filinos ?', 'Traité de Filinos'],
      ['Quand a lieu la première guerre punique ?', 'Première guerre punique']
    ])('%s -> %s', (question, expected) => {
      expect(getEventName(question)).toBe(expected)
    })
  })

  describe('«Quand a-t-elle lieu»', () => {
    it('extracts the subject and drops the article', () => {
      expect(getEventName("Quand la révolte d'esclave de Spartacus a-t-elle lieu ?")).toBe(
        "Révolte d'esclave de Spartacus"
      )
    })
  })

  describe('«Quand est/sont + participe …»', () => {
    it.each([
      ['Quand est adoptée la loi Ogulnia ?', 'Loi Ogulnia'],
      ['Quand est adoptée la loi Hortensia ?', 'Loi Hortensia'],
      ['Quand est adoptée la loi Villia Annalis ?', 'Loi Villia Annalis'],
      // typo in the deck ("adoptée" instead of "adoptées") and no space before "?"
      ['Quand sont adoptée les lois Gabinia, Cassia et Papiria?', 'Lois Gabinia, Cassia et Papiria']
    ])('%s -> %s', (question, expected) => {
      expect(getEventName(question)).toBe(expected)
    })
  })

  describe('«Quand débute / commence …»', () => {
    it('handles débute', () => {
      expect(getEventName('Quand débute la République romaine ?')).toBe('République romaine')
    })

    it('handles commence', () => {
      expect(getEventName('Quand commence la guerre sociale ?')).toBe('Guerre sociale')
    })
  })

  describe('«… est-il/elle + complément»', () => {
    it.each([
      ['Quand la loi des Douze Tables est-elle rédigée ?', 'Loi des Douze Tables rédigée'],
      ['Quand la lex Calpurnia est-elle promulguée ?', 'Lex Calpurnia promulguée'],
      ["Quand les provinces d'Espagne sont-elles créées ?", "Provinces d'Espagne créées"],
      [
        'Quand les provinces de Sicile, Sardaigne et Corse sont-elles créées ?',
        'Provinces de Sicile, Sardaigne et Corse créées'
      ],
      ["Quand la province d'Asie est-elle créée ?", "Province d'Asie créée"],
      ['Quand César est-il édile', 'César édile']
    ])('%s -> %s', (question, expected) => {
      expect(getEventName(question)).toBe(expected)
    })
  })

  describe('sentence-like fallbacks (verb + subject)', () => {
    it.each([
      [
        'Quand Rome proclame-t-elle la liberté du monde grec ?',
        'Rome proclame la liberté du monde grec'
      ],
      ['Quand Rome prend-elle Tarente ?', 'Rome prend Tarente'],
      ['Quand Hannibal arrive-t-il en Italie ?', 'Hannibal arrive en Italie'],
      [
        'Quand Caius Marius est-il consul six fois de suite ?',
        'Caius Marius consul six fois de suite'
      ]
    ])('%s -> %s', (question, expected) => {
      expect(getEventName(question)).toBe(expected)
    })
  })

  describe('no event in the question', () => {
    it('returns an empty string for «Que se passe-t-il …»', () => {
      expect(getEventName('Que se passe-t-il en 218 av. J.-C. ?')).toBe('')
    })

    it('returns an empty string for unrecognised input', () => {
      expect(getEventName('Bonjour')).toBe('')
      expect(getEventName('')).toBe('')
      expect(getEventName('Quand ?')).toBe('')
    })
  })

  describe('normalisation', () => {
    it('is case-insensitive on the question words', () => {
      expect(getEventName('quand a lieu la bataille de Cannes ?')).toBe('Bataille de Cannes')
    })

    it('works without a trailing question mark', () => {
      expect(getEventName('Quand a lieu la bataille de Cannes')).toBe('Bataille de Cannes')
    })

    it('trims and collapses whitespace, including trailing newlines', () => {
      expect(getEventName('  Quand  a lieu   la bataille de Cannes ?\n')).toBe('Bataille de Cannes')
    })

    it("strips elided articles (l' and l’)", () => {
      expect(getEventName("Quand a lieu l'assassinat de César ?")).toBe('Assassinat de César')
      expect(getEventName('Quand a lieu l’assassinat de César ?')).toBe('Assassinat de César')
    })

    it.each(['la', 'le', 'les', 'un', 'une', 'des'])('strips the article «%s»', (article) => {
      expect(getEventName(`Quand a lieu ${article} bataille ?`)).toBe('Bataille')
    })
  })

  describe('invariants', () => {
    const questions = [
      'Quand a lieu la bataille de Cannes ?',
      'Quand est adoptée la loi Hortensia ?',
      'Quand débute la République romaine ?',
      'Quand la loi des Douze Tables est-elle rédigée ?',
      'Quand César est-il édile',
      'Quand Rome prend-elle Tarente ?',
      "Quand la révolte d'esclave de Spartacus a-t-elle lieu ?",
      "Quand les provinces d'Espagne sont-elles créées ?"
    ]

    it.each(questions)('«%s» gives a clean, capitalised name', (question) => {
      const name = getEventName(question)
      expect(name).not.toBe('')
      expect(name).toBe(name.trim())
      expect(name).not.toMatch(/\?/)
      expect(name).not.toMatch(/^(?:l['’]|(?:la|le|les|un|une|des)\s)/i)
      expect(name[0]).toBe(name[0].toUpperCase())
    })
  })
})
