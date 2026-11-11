// findFirstTimeMarker.test.ts
import { describe, it, expect } from 'vitest'
import { findFirstTimeMarker } from './timeMarkerDetection'

const find = (s: string) => findFirstTimeMarker(s)

describe('findFirstTimeMarker', () => {
  describe('regressions: BCE and ranges', () => {
    it.each([
      // input, start year, end year, matched text
      ['-212, les Romains recrutent une armée et reprennent Capoue', -211, undefined, '-212'],
      ['-218 à -202', -217, -201, '-218 à -202'],
      ['Entre 122 et 118 av. J.-C.', -121, -117, 'Entre 122 et 118 av. J.-C.'],
      ['Entre 241 et 227 av. J.-C.', -240, -226, 'Entre 241 et 227 av. J.-C.'],
      ['De 107 à 100 av. J.-C.', -106, -99, 'De 107 à 100 av. J.-C.'],
      ['Entre 241 et 227 av. J.-C.', -240, -226, 'Entre 241 et 227 av. J.-C.']
    ])('%s', (input, start, end, text) => {
      const m = find(input)!
      expect(m).not.toBeNull()
      expect(m.index).toBe(0)
      expect(m.text).toBe(text)
      expect(m.marker.start.year).toBe(start)
      expect(m.marker.end?.year).toBe(end)
      expect(m.marker.precision).toBe('year')
    })

    it('treats a sign on the first number only as BCE for both ("-218-202")', () => {
      const m = find('-218-202')!
      expect(m.marker.start.year).toBe(-217)
      expect(m.marker.end?.year).toBe(-201)
    })
  })

  describe('days and months', () => {
    it('parses a full date', () => {
      const m = find('14 octobre 1066')!
      expect(m.marker).toMatchObject({
        start: { year: 1066, month: 10, day: 14 },
        precision: 'day'
      })
      expect(m.marker.end).toBeUndefined()
    })

    it('parses "1er"', () => {
      const m = find('Le 1er mai 1789')!
      expect(m.text).toBe('1er mai 1789')
      expect(m.marker.start).toEqual({ year: 1789, month: 5, day: 1 })
    })

    it('parses month + year', () => {
      const m = find('en mars 1048')!
      expect(m.text).toBe('mars 1048')
      expect(m.marker).toMatchObject({ start: { year: 1048, month: 3 }, precision: 'month' })
    })

    it('prefers the full date over the bare year at the same position', () => {
      const m = find('14 octobre 1066')!
      expect(m.text).toBe('14 octobre 1066')
      expect(m.marker.precision).toBe('day')
    })
  })

  describe('centuries', () => {
    it('parses roman numerals', () => {
      const m = find('Au XIe siècle, un roi')!
      expect(m.text).toBe('XIe siècle')
      expect(m.index).toBe(3)
      expect(m.marker).toMatchObject({
        start: { year: 1001 },
        end: { year: 1100 },
        precision: 'century'
      })
    })

    it('parses arabic numerals', () => {
      const m = find('11e siècle')!
      expect(m.marker.start.year).toBe(1001)
      expect(m.marker.end?.year).toBe(1100)
    })

    it('parses the 2nd century BCE', () => {
      const m = find('IIe siècle av. J.-C.')!
      expect(m.marker.start.year).toBe(-199)
      expect(m.marker.end?.year).toBe(-100)
    })

    it('ends the 1st century BCE at year 0 (not -0)', () => {
      const m = find('Ier siècle av. J.-C.')!
      expect(m.marker.start.year).toBe(-99)
      expect(m.marker.end?.year).toBe(0) // toBe uses Object.is, so -0 would fail
    })
  })

  describe('years', () => {
    it('parses an approximate year', () => {
      const m = find('Né vers 1048, il meurt le 14 octobre 1066')!
      expect(m.text).toBe('vers 1048')
      expect(m.index).toBe(3)
      expect(m.marker).toEqual({
        start: { year: 1048 },
        precision: 'year',
        approximate: true,
        sortKey: 10480101
      })
    })

    it('parses a bare year without approximate flag', () => {
      const m = find('Né en 1048')!
      expect(m.text).toBe('1048')
      expect(m.marker.approximate).toBe(false)
    })

    it('parses a short BCE year', () => {
      const m = find('Mort de César en 44 av. J.-C.')!
      expect(m.text).toBe('44 av. J.-C.')
      expect(m.marker.start.year).toBe(-43)
    })

    it('parses "BCE" in full', () => {
      const m = find('en 44 BCE')!
      expect(m.text).toBe('44 BCE')
      expect(m.marker.start.year).toBe(-43)
    })

    it('maps 1 BCE to year 0 (not -0)', () => {
      expect(find('1 av. J.-C.')!.marker.start.year).toBe(0)
    })

    it('parses an approximate BCE year', () => {
      const m = find('vers 480 av. J.-C.')!
      expect(m.text).toBe('vers 480 av. J.-C.')
      expect(m.marker.start.year).toBe(-479)
      expect(m.marker.approximate).toBe(true)
    })
  })

  describe('ranges (CE)', () => {
    it('parses "1914-1918"', () => {
      const m = find('1914-1918')!
      expect(m.marker.start.year).toBe(1914)
      expect(m.marker.end?.year).toBe(1918)
    })

    it('expands a two-digit end year ("1914-18")', () => {
      const m = find('1914-18')!
      expect(m.text).toBe('1914-18')
      expect(m.marker.end?.year).toBe(1918)
    })

    it('parses "Entre 1040 et 1050"', () => {
      const m = find('Entre 1040 et 1050')!
      expect(m.text).toBe('Entre 1040 et 1050')
      expect(m.marker.start.year).toBe(1040)
      expect(m.marker.end?.year).toBe(1050)
    })
  })

  describe('first match wins', () => {
    it('returns the earliest marker in the string', () => {
      const m = find('En 1066 puis en 1048')!
      expect(m.marker.start.year).toBe(1066)
    })

    it('does not report a signed year as its unsigned digits', () => {
      const m = find('-212, les Romains')!
      expect(m.index).toBe(0)
      expect(m.text).toBe('-212')
    })
  })

  describe('negative cases', () => {
    it.each([
      [''],
      ['Aucune date ici'],
      ['Il y a 12 personnes'],
      ['le 3 et 4 mars'] // short numbers without BCE hint are not a range
    ])('returns null for %j', (input) => {
      expect(find(input)).toBeNull()
    })

    it.todo('should not treat "2000 personnes" as a year (needs context check)')
  })

  describe('sortKey', () => {
    it('orders BCE before CE and keeps order within BCE', () => {
      const k = (s: string) => find(s)!.marker.sortKey
      expect(k('-218')).toBeLessThan(k('-212'))
      expect(k('-212')).toBeLessThan(k('1048'))
      expect(k('1048')).toBeLessThan(k('14 octobre 1066'))
    })
  })
})
