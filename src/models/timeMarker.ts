export type Precision = 'day' | 'month' | 'year' | 'century'

export interface TimePoint {
  year: number // astronomical: 1 BCE = 0, 2 BCE = -1, ...
  month?: number // 1-12
  day?: number // 1-31
}

export interface TimeMarker {
  start: TimePoint
  end?: TimePoint // present for ranges, centuries, seasons
  precision: Precision // how to display it and how strict to be when grading
  approximate?: boolean // "vers 1048"
  sortKey: number // for orderBy / timeline ordering
}

export const sortKey = (p: TimePoint) => p.year * 10000 + (p.month ?? 0) * 100 + (p.day ?? 0)

const ROMAN_NUMERALS: [number, string][] = [
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I']
]

const toRoman = (n: number): string => {
  if (!Number.isInteger(n) || n < 1 || n > 50) {
    throw new RangeError(`toRoman only supports integers from 1 to 50, got ${n}`)
  }
  let result = ''
  for (const [value, symbol] of ROMAN_NUMERALS) {
    while (n >= value) {
      result += symbol
      n -= value
    }
  }
  return result
}

export const asAnwser = (timeMarker: TimeMarker): string => {
  let year = timeMarker.start.year
  let eraIndicator = ''
  if (year <= 0) {
    year -= 1
    year = Math.abs(year)
    eraIndicator = 'av. J-C'
  }
  let result: string

  switch (timeMarker.precision) {
    case 'century':
      const century = Math.ceil(year / 100)
      const centurySuffix = century === 1 ? 'er' : 'e'
      result = `Au ${toRoman(century)}<sup>${centurySuffix}</sup> siècle`
      break
    case 'year':
      result = `En ${year}`
      break
    case 'month':
      result = `En ${timeMarker.start.month} ${year}`
      break
    case 'day':
      result = `Le ${timeMarker.start.day} ${timeMarker.start.month} ${year}`
      break
  }
  return `${result} ${eraIndicator}`
}
