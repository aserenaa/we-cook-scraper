/**
 * Generates a list of dates for all Sundays within a specified month and year.
 *
 * @param {number} year - The year for which to generate Sunday dates.
 * @param {number} month - The month for which to generate Sunday dates (0-11, where January is 0).
 * @returns {string[]} An array of date strings representing each Sunday of the month, formatted as 'YYYY-MM-DD'.
 */
export const getSundaysOfMonth = (year, month) => {
  const sundays = []
  // Start from the first day of the specified month and year in EDT
  const date = new Date(Date.UTC(year, month, 1, 4)) // UTC time + 4 hours to ensure EDT offset

  // Adjust date to the first Sunday of the month
  while (date.getUTCDay() !== 1) {
    date.setUTCDate(date.getUTCDate() + 1)
  }

  // Loop through the month, adding each Sunday to the array
  while (date.getUTCMonth() === month) {
    const formattedDate = new Date(date.getTime() - 4 * 60 * 60 * 1000) // Adjust back to local EDT
      .toISOString()
      .split('T')[0]
    sundays.push(formattedDate)
    date.setUTCDate(date.getUTCDate() + 7)
    if (date.getUTCMonth() !== month) break // Ensure the date is part of the specified month
  }

  return sundays
}
