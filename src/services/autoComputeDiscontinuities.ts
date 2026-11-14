import type { Discontinuity } from '../models/discontinuity'
import type { TimeMarker } from '../models/timeMarker'

const AUTO_GAP_RATIO = 0.2 // a break must hide at least 20% of the timeline
const AUTO_GAP_MEDIAN_FACTOR = 8

export const autoComputeDiscontinuities = (events: TimeMarker[]): Discontinuity[] => {
  const spans = events
    .map((e) => ({ start: e.start.year, end: e.end?.year ?? e.start.year }))
    .sort((a, b) => a.start - b.start)
  if (spans.length < 2) return []

  const gaps: { from: number; to: number }[] = []
  let coveredUntil = spans[0].end
  for (const s of spans.slice(1)) {
    if (s.start > coveredUntil) gaps.push({ from: coveredUntil, to: s.start })
    coveredUntil = Math.max(coveredUntil, s.end)
  }

  const totalSpan = coveredUntil - spans[0].start
  const sizes = gaps.map((g) => g.to - g.from).sort((a, b) => a - b)
  const median = sizes[Math.floor(sizes.length / 2)] ?? 0
  const minGap = Math.max(totalSpan * AUTO_GAP_RATIO, median * AUTO_GAP_MEDIAN_FACTOR)

  return gaps
    .filter((g) => g.to - g.from >= minGap)
    .map((g) => ({ from: { year: g.from }, to: { year: g.to } }))
}
