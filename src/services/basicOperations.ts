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
