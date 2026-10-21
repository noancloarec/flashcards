/**
 * Normalizes a string for search purposes
 * Removes accent and put it into lowercase
 * @param {string}  str  The string to normalize
 */
const normalizeForSearch = (str: string) =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const sum = (numbers: number[]) => numbers.reduce((acc, n) => acc + n, 0)

const matchScore: (searchPattern: string, candidate: string) => number = (
  searchPattern,
  candidate
) => {
  searchPattern = normalizeForSearch(searchPattern)
  candidate = normalizeForSearch(candidate)
  const words = searchPattern.trim().split(' ')
  const wordsScore = words.map((word) => (candidate.includes(word) ? 1 : 0))
  return sum(wordsScore)
}

/**
 * Performs a search through an array an returns an array containing the items that matched the search pattern
 * An item matches if one ore more of the words in the pattern matches with the item
 * Items that match the most words are presented first
 * @param pattern the pattern to search for
 * @param items the items to search in
 * @param searchField A function to define what field in an item should be used for the search
 * @returns items that match the search pattern
 */
export const searchResults: <T>(
  pattern: string,
  items: T[],
  searchField: (item: T) => string
) => T[] = (pattern, items, searchField) => {
  const itemsWithSearchScore = items.map((item) => ({
    item,
    score: matchScore(pattern, searchField(item))
  }))
  const sortedAndFiltered = itemsWithSearchScore
    .filter(({ score }) => score !== 0)
    .sort((a, b) => b.score - a.score)
  return sortedAndFiltered.map(({ item }) => item)
}
