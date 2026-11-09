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

export const sortKey = (p: TimePoint) => p.year * 10000 + (p.month ?? 1) * 100 + (p.day ?? 1)

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

const fromAstro = (year: number) =>
  year <= 0 ? { year: -(year - 1), bce: true } : { year: year, bce: false }

export const toReadableTimeMarker = (timeMarker: TimeMarker): string => {
  const { year: startYear, bce: startYearBce } = fromAstro(timeMarker.start.year)
  const startEraIndicator = startYearBce ? ' av. J-C' : ''

  if (timeMarker.end) {
    const { year: endYear, bce: endYearBce } = fromAstro(timeMarker.end.year)

    switch (timeMarker.precision) {
      case 'century':
        const century = Math.ceil(startYear / 100)
        const centurySuffix = century === 1 ? 'er' : 'e'
        return `Au ${toRoman(century)}<sup>${centurySuffix}</sup> siècle${startEraIndicator}`
      case 'year':
        return startYearBce && !endYearBce
          ? `De ${startYear} av. J-C à ${endYear} ap. J-C`
          : `De ${startYear} à ${endYear}${startEraIndicator}`
    }
  }

  switch (timeMarker.precision) {
    case 'century':
    case 'year':
      return `En ${startYear}${startEraIndicator}`
    case 'month':
      return `En ${timeMarker.start.month} ${startYear}${startEraIndicator}`
    case 'day':
      return `Le ${timeMarker.start.day} ${timeMarker.start.month} ${startYear}${startEraIndicator}`
  }
}
