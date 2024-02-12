/**
 * Generates a list of dates for all Mondays within a specified month and year.
 *
 * @param {number} year - The year for which to generate Monday dates.
 * @param {number} month - The month for which to generate Monday dates (0-11, where January is 0).
 * @returns {string[]} An array of date strings representing each Monday of the month, formatted as 'YYYY-MM-DD'.
 */
export const getMondaysOfMonth = (year, month) => {
  const mondays = []
  // Start from the first day of the specified month and year
  const date = new Date(year, month, 1)

  // Adjust date to the first Monday of the month
  while (date.getDay() !== 1) {
    date.setDate(date.getDate() + 1)
  }

  // Loop through the month, adding each Monday to the array
  while (date.getMonth() === month) {
    const formattedDate = date.toISOString().split('T')[0]
    mondays.push(formattedDate)
    date.setDate(date.getDate() + 7)
  }

  return mondays
}
