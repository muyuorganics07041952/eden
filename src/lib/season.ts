/**
 * Seasonal scheduling utilities for garden and care tasks.
 * Pure functions with no external dependencies.
 */

/**
 * Returns true if the given month (1-12) is within the active season.
 * Null start/end means always active.
 * Cross-year logic: if start > end (e.g., Nov=11 to Mar=3),
 * the task is active when month >= start OR month <= end.
 */
export function isInSeason(
  month: number,
  start: number | null,
  end: number | null
): boolean {
  if (start === null || end === null) {
    return true
  }

  if (start <= end) {
    // Normal range: e.g., Mar(3) to Sep(9)
    return month >= start && month <= end
  }

  // Cross-year range: e.g., Nov(11) to Mar(3)
  return month >= start || month <= end
}

/**
 * Given a recurring task that was just completed, adjusts nextDate to the first day
 * of the next season start month if nextDate falls outside the active season.
 * Returns nextDate unchanged if no season is set or if already in season.
 *
 * Cross-year logic: if start > end (e.g., Nov=11 to Mar=3),
 * active when month >= start OR month <= end.
 *
 * If the month of nextDate is outside the season, find the next occurrence
 * of the start month:
 * - If start month hasn't happened yet this year, use YYYY-start-01
 * - If it already passed, use (YYYY+1)-start-01
 */
export function adjustDateForSeason(
  nextDate: string, // YYYY-MM-DD
  start: number | null,
  end: number | null
): string {
  if (start === null || end === null) {
    return nextDate
  }

  const [yearStr, monthStr] = nextDate.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)

  if (isInSeason(month, start, end)) {
    return nextDate
  }

  // Out of season: jump to the first day of the next start month
  const startMonthStr = String(start).padStart(2, '0')

  if (month < start) {
    // Start month hasn't happened yet this year
    return `${year}-${startMonthStr}-01`
  }

  // Start month already passed this year, use next year
  return `${year + 1}-${startMonthStr}-01`
}
