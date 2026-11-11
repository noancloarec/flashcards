import { sortKey, type TimeMarker, type TimePoint } from '../models/timeMarker'

export interface TimeMatch {
  text: string
  index: number
  marker: TimeMarker
}

const MONTHS: Record<string, number> = {
  janvier: 1,
  février: 2,
  fevrier: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  août: 8,
  aout: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  décembre: 12,
  decembre: 12,
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12
}
const MONTH_RE = Object.keys(MONTHS).join('|')
const APPROX = String.raw`(?:(vers|environ|circa|ca\.?|c\.|v\.|about|around)\s+)?`
const BCE_TXT = String.raw`av(?:ant|\.)?\s*J\.?-?C\.?|BCE|BC`
const BCE = String.raw`(?:\s+(${BCE_TXT}))?`

const toAstro = (n: number, bce: boolean) => (bce ? 1 - n : n)

function roman(s: string): number {
  const v: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 }
  const u = s.toUpperCase()
  let total = 0
  for (let i = 0; i < u.length; i++) {
    const cur = v[u[i]],
      next = v[u[i + 1]] ?? 0
    total += cur < next ? -cur : cur
  }
  return total
}

interface Rule {
  re: RegExp
  build: (m: RegExpExecArray) => TimeMarker | null
}

const rules: Rule[] = [
  {
    // 14 octobre 1066, 1er mai 1789
    re: new RegExp(String.raw`\b${APPROX}(\d{1,2}|1er)\s+(${MONTH_RE})\s+(\d{1,4})${BCE}`, 'gi'),
    build: (m) => {
      const day = parseInt(m[2], 10)
      if (day < 1 || day > 31) return null
      const start = { year: toAstro(+m[4], !!m[5]), month: MONTHS[m[3].toLowerCase()], day }
      return {
        start,
        precision: 'day',
        approximate: !!m[1] || false,
        sortKey: sortKey(start)
      }
    }
  },
  {
    // mars 1048
    re: new RegExp(String.raw`\b${APPROX}(${MONTH_RE})\s+(\d{1,4})${BCE}`, 'gi'),
    build: (m) => {
      const start = { year: toAstro(+m[3], !!m[4]), month: MONTHS[m[2].toLowerCase()] }
      return {
        start,
        precision: 'month',
        approximate: !!m[1] || false,
        sortKey: sortKey(start)
      }
    }
  },
  {
    // XIe siècle, 11e siècle, Ier siècle av. J.-C.
    re: new RegExp(
      String.raw`\b${APPROX}([IVXLC]+|\d{1,2})\s*(?:e|ème|eme|er|ᵉ|ʳ)?\s+siècle${BCE}`,
      'gi'
    ),
    build: (m) => {
      const n = /^\d+$/.test(m[2]) ? +m[2] : roman(m[2])
      if (!n) return null
      const bce = !!m[3]
      const start = { year: bce ? -(n * 100) + 1 : (n - 1) * 100 + 1 }
      const end = { year: bce ? (1 - n) * 100 : n * 100 }
      return {
        start,
        end,
        precision: 'century',
        approximate: !!m[1] || false,
        sortKey: sortKey(start)
      }
    }
  },
  // Range: "-218 à -202", "Entre 122 et 118 av. J.-C.", "De 107 à 100 av. J.-C.", "1914-18"
  {
    re: new RegExp(
      String.raw`(?<![\w-])${APPROX}(?:(?:entre|de|du|from)\s+)?(-)?(\d{1,4})` +
        String.raw`(?:\s+(?:à|au|et|and|to)\s+|\s*[-–—]\s*)(-)?(\d{1,4})(?:\s+(${BCE_TXT}))?(?!\d)`,
      'gi'
    ),
    build: (m) => {
      const bce = !!m[2] || !!m[4] || !!m[6]
      const a = +m[3]
      let b = +m[5]

      // Without any BCE hint, only accept "real" years (avoids "le 3 et 4 mars")
      if (!bce && (m[3].length < 3 || m[5].length < 2)) return null
      if (!bce && m[5].length === 2) b = Math.floor(a / 100) * 100 + b // 1914-18
      if (!bce && b < a) return null

      // BCE: the larger number is the earlier date
      const [from, to] = bce ? [Math.max(a, b), Math.min(a, b)] : [a, b]
      const start = { year: toAstro(from, bce) }
      const end = { year: toAstro(to, bce) }
      return {
        start,
        end,
        precision: 'year',
        approximate: !!m[1] || false,
        sortKey: sortKey(start)
      }
    }
  },
  // Signed single year: "-212, les Romains ..."
  {
    re: new RegExp(String.raw`(?<![\w-])${APPROX}-(\d{1,4})(?!\d)`, 'gi'),
    build: (m) => {
      const start = { year: toAstro(+m[2], true) }
      return { start, precision: 'year', approximate: !!m[1] || false, sortKey: sortKey(start) }
    }
  },
  {
    // 44 av. J.-C. (short BCE years need the BCE marker)
    re: new RegExp(String.raw`\b${APPROX}(\d{1,4})\s+(${BCE_TXT})`, 'gi'),
    build: (m) => {
      const start = { year: toAstro(+m[2], true) }
      return {
        start,
        precision: 'year',
        approximate: !!m[1] || false,
        sortKey: sortKey(start)
      }
    }
  },
  {
    // vers 1048, 1048
    re: new RegExp(String.raw`\b${APPROX}(\d{3,4})\b`, 'gi'),
    build: (m) => {
      const start = { year: +m[2] }
      return {
        start,
        precision: 'year',
        approximate: !!m[1] || false,
        sortKey: sortKey(start)
      }
    }
  }
]

export function findFirstTimeMarker(text: string): TimeMatch | null {
  let best: TimeMatch | null = null

  for (const { re, build } of rules) {
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(text))) {
      const marker = build(m)
      if (!marker) continue // invalid candidate: keep scanning with this rule
      const better =
        !best || m.index < best.index || (m.index === best.index && m[0].length > best.text.length)
      if (better) best = { text: m[0], index: m.index, marker }
      break // first valid match of this rule is all we need
    }
  }
  return best
}
