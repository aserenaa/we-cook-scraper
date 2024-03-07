import { createInterface } from 'readline'
import { newScrapeMenu, scrapeMenuLinksByDate } from './scrapers/index.js'
import { saveToJsonFile } from './services/fileService.js'
import { getMondaysOfMonth, isValidMonday } from './utils/index.js'

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
})

/**
 * Asynchronously prompts the user with a question and returns the response.
 * @param {string} question - The question to prompt the user with.
 * @returns {Promise<string>} A promise that resolves with the user's response.
 */
const askQuestion = (question) => new Promise(resolve => rl.question(question, resolve))

/**
 * Validates and returns valid Monday dates from a given array of date strings.
 * @param {Array<string>} dateStrs - Array of date strings to validate.
 * @returns {Array<string>} An array of valid Monday dates.
 */
const getValidMondays = (dateStrs) => {
  return dateStrs.filter(dateStr => {
    if (!isValidMonday(dateStr)) {
      console.error(`Invalid or not a Monday date: ${dateStr}`)
      return false
    }
    return true
  })
}

/**
 * Collects dates to scrape either from command line arguments or via user prompt.
 * @returns {Promise<Array<string>>} A promise that resolves with an array of dates to scrape.
 */
const collectDatesToScrape = async () => {
  const commandLineArgs = process.argv.slice(2)

  if (commandLineArgs.length > 0) {
    return getValidMondays(commandLineArgs)
  }

  const choice = await askQuestion('Select option:\n1. Run for a specific date\n2. Run for the current and next month\nEnter option number (1 or 2): ')
  switch (choice.trim()) {
    case '1': {
      const specificDates = await askQuestion('Enter Monday dates separated by space with the format YYYY-MM-DD (e.g. 2021-08-02 2021-08-09): ')
      return getValidMondays(specificDates.split(' '))
    }

    case '2': {
      const currentDate = new Date()
      return getMondaysOfMonth(currentDate.getFullYear(), currentDate.getMonth())
        .concat(getMondaysOfMonth(currentDate.getFullYear(), currentDate.getMonth() + 1))
    }
    default: {
      console.error('Invalid option.')
      process.exit(1)
    }
  }
}

/**
 * Orchestrates the web scraping process based on the provided dates.
 * @param {Array<string>} datesToScrape - Dates for which to scrape menu data.
 */
const orchestrateScraping = async (datesToScrape) => {
  for (const date of datesToScrape) {
    const weekMenuUrls = await scrapeMenuLinksByDate(date)
    if (weekMenuUrls.length === 0) {
      console.log(`No URLs found for ${date}. Skipping.`)
      continue
    }
    const weekMenus = await Promise.all(weekMenuUrls.map(newScrapeMenu))
    await saveToJsonFile(`weekMenuData-${date}.json`, { date, numberOfWeekMenus: weekMenus.length, weekMenus })
    console.info(`Scraping completed for ${date}. Data saved to weekMenuData-${date}.json`)
  }
  console.info('Scraping process completed.')
}

/**
 * The main function to run the script.
 */
const main = async () => {
  try {
    const datesToScrape = await collectDatesToScrape()
    if (datesToScrape.length === 0) {
      console.error('No valid dates to scrape. Exiting.')
      return
    }
    await orchestrateScraping(datesToScrape)
  } catch (error) {
    console.error('Error during the scraping process:', error.message)
  } finally {
    rl.close()
  }
}

main()
