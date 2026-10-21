/**
 * Map the values of an object
 * @param obj the object whose values must be mapped, keys won't change
 * @param fn the map function
 * @returns A copy of obj, but the values have been mapped
 */
export const mapValues = <K extends string, V, R>(
  obj: Record<K, V>,
  fn: (value: V) => R
): Record<K, R> =>
  Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, fn(value as V)])) as Record<
    K,
    R
  >

/**
 * Generates numbers between a range
 * @param start start number (included)
 * @param stop end number (excluded)
 * @param step step between each number
 * @returns a list of numbers ranging between start and stop (excluded)
 */
export const range = (start: number, stop: number, step = 1) =>
  Array(Math.ceil((stop - start) / step))
    .fill(start)
    .map((x, y) => x + y * step)
