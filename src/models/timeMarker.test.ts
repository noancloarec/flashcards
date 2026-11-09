import { describe, expect, it } from 'vitest'
import { toReadableTimeMarker, type TimeMarker } from './timeMarker'

describe('toReadableTimeMarker', () => {
  it('Formats a timemarker BCE', () => {
    const yearRangeBCE: TimeMarker = {
      precision: 'year',
      start: { year: -263 },
      end: { year: -240 },
      sortKey: 0
    }
    expect(toReadableTimeMarker(yearRangeBCE)).toBe('De 264 à 241 av. J-C')
  })
  it('Formats a timemarker BCE', () => {
    const yearRangeCE: TimeMarker = {
      precision: 'year',
      start: { year: 14 },
      end: { year: 17 },
      sortKey: 0
    }
    expect(toReadableTimeMarker(yearRangeCE)).toBe('De 14 à 17')
  })
  it('Formats a timemarker Before and after Common Era', () => {
    const yearRangeBeforeAndAfterCE: TimeMarker = {
      precision: 'year',
      start: { year: -62 },
      end: { year: 14 },
      sortKey: 0
    }
    expect(toReadableTimeMarker(yearRangeBeforeAndAfterCE)).toBe('De 63 av. J-C à 14 ap. J-C')
  })
})
