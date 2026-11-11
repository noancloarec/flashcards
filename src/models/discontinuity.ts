import type { TimePoint } from './timeMarker'

/**
 * A discontinuity in a timeline
 * Timeline sometimes depict a large period of time with most events taking place in a short time and long periods of no-events
 * In order not to make the timeline look empty, discontinuities can be specified so the timeline is cut during these years
 */
export interface Discontinuity {
  from: TimePoint
  to: TimePoint
}

/**
 * How many years the discontinuity lasts
 * @param discontinuity the discontinuity
 * @returns How many years there are between its from and to parameters
 */
const yearSpan = (discontinuity: Discontinuity) => discontinuity.to.year - discontinuity.from.year

/**
 * Compute the sum of yearspan for the list of discontinuities
 * @param discontinuities the discontinuities
 * @returns the sum of their yearspan
 */
export const sumYearSpan = (discontinuities: Discontinuity[]) =>
  discontinuities.map(yearSpan).reduce((partialSum, a) => partialSum + a, 0)
