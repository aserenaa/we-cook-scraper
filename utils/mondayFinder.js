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

/**
 * Validates whether the input string is a date in YYYY-MM-DD format and falls on a Monday.
 * @param {string} dateStr - The date string to validate.
 * @returns {boolean} True if the date is valid and falls on a Monday, false otherwise.
 */
export const isValidMonday = (dateStr) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateStr)) {
    return false
  }

  const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10))
  const date = new Date(year, month - 1, day)

  const dayOfWeek = date.getDay()
  return dayOfWeek === 1
}
