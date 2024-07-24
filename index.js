import ora from 'ora'
import { createInterface } from 'readline'
import { mealServices } from './config.js'
import { factorScrapeMenuLinksByPeriod, factorScrapeNutritionFacts, weCookScrapeMenu, weCookScrapeMenuLinksByDate } from './scrapers/index.js'
import { saveToJsonFile } from './services/fileService.js'
import { getSundaysOfMonth } from './utils/index.js'

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
})

/**
 * Asynchronously prompts the user with a question and returns the response.
 * @param {string} question - The question to prompt the user with.
 * @returns {Promise<string>} A promise that resolves with the user's response.
 */
const promptUser = (question) => {
  return new Promise(resolve => rl.question(question, resolve))
}

/**
 * Transforms a given date to the closest Sunday.
 * @param {string} dateStr - The date string in YYYY-MM-DD format.
 * @returns {string} The date string of the closest Sunday in YYYY-MM-DD format.
 */
const getClosestSunday = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00-04:00') // EDT offset
  const dayOfWeek = date.getUTCDay()
  const diffToSunday = dayOfWeek
  date.setUTCDate(date.getUTCDate() - diffToSunday)
  return date.toISOString().split('T')[0]
}

/**
 * Calculates the week number of the year for a given date.
 * @param {Date} date - The date for which to calculate the week number.
 * @returns {string} The week number in YYYY-W## format.
 */
const getWeekFormat = (date) => {
  const year = date.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000
  const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7)
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`
}

/**
 * Validates and returns dates in the correct format based on the service format.
 * @param {string[]} dateStrs - Array of date strings to validate.
 * @param {string} serviceFormat - The service format ('weCookMeals' or 'factorMeals').
 * @returns {string[]} An array of dates in the correct format.
 */
const transformDates = (dateStrs, serviceFormat) => {
  switch (serviceFormat) {
    case 'weCookMeals':
      return dateStrs.map(getClosestSunday)
    case 'factorMeals':
      return dateStrs.map(dateStr => getWeekFormat(new Date(dateStr)))
    default:
      console.error('Invalid service format.')
      return []
  }
}

/**
 * Prompts the user to select a meal service to scrape.
 *
 * @returns {Promise<Object>} A promise that resolves with the selected meal service.
 * @throws Will exit the process if an invalid option is selected.
 */
const selectServiceToScrape = async () => {
  const services = Object.values(mealServices)

  console.log('Select a service to scrape:')
  services.forEach((service, index) => {
    console.log(`${index + 1}. ${service.name}`)
  })

  const choice = await promptUser(`Enter option number (1-${services.length}): `)
  const selectedServiceIndex = parseInt(choice.trim(), 10) - 1

  if (!Number.isInteger(selectedServiceIndex) || selectedServiceIndex < 0 || selectedServiceIndex >= services.length) {
    console.error('Invalid option.')
    process.exit(1)
  }

  return services[selectedServiceIndex]
}

/**
 * Collects dates to scrape either from command line arguments or via user prompt.
 * @returns {Promise<Array<string>>} A promise that resolves with an array of dates to scrape.
 */
const collectDatesToScrape = async (service) => {
  const serviceFormat = service.name === 'Factor Meals' ? 'factorMeals' : 'weCookMeals'

  const choice = await promptUser('Select option:\n1. Run for a specific date.\n2. Run for the current month.\nEnter option number (1 or 2): ')
  switch (choice.trim()) {
    case '1': {
      const specificDates = await promptUser('Enter dates separated by space with the format YYYY-MM-DD (e.g. 2024-08-02 2024-08-09): ')
      return transformDates(specificDates.split(' '), serviceFormat)
    }

    case '2': {
      const currentDate = new Date()
      const mondays = getSundaysOfMonth(currentDate.getFullYear(), currentDate.getMonth())
      return transformDates(mondays, serviceFormat)
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
 * @param {string} serviceName - Name of the selected service.
 */
const orchestrateScraping = async (datesToScrape, serviceName) => {
  const spinner = ora('Scraping data...').start()
  try {
    for (const date of datesToScrape) {
      let weekMenuUrls = []
      if (serviceName === 'Factor Meals') {
        weekMenuUrls = await factorScrapeMenuLinksByPeriod(date)
      } else {
        weekMenuUrls = await weCookScrapeMenuLinksByDate(date)
      }

      if (weekMenuUrls.length === 0) {
        console.log(`No URLs found for ${date}. Skipping.`)
        continue
      }

      const scrapeMenu = serviceName === 'Factor Meals' ? factorScrapeNutritionFacts : weCookScrapeMenu
      const weekMenus = await Promise.all(weekMenuUrls.map(scrapeMenu))
      await saveToJsonFile(serviceName.toLowerCase(), `weekMenuData-${date}.json`, { date, numberOfWeekMenus: weekMenus.length, weekMenus })
      spinner.succeed(`Scraping completed for ${date}.`)
    }
  } catch (error) {
    spinner.fail('Scraping process failed.')
    throw error
  } finally {
    spinner.stop()
  }
}

/**
 * The main function to run the script.
 */
const main = async () => {
  try {
    const service = await selectServiceToScrape()
    const datesToScrape = await collectDatesToScrape(service)

    console.log(datesToScrape)

    if (datesToScrape.length === 0) {
      console.error('No valid dates to scrape. Exiting.')
      process.exit(1)
    }
    await orchestrateScraping(datesToScrape, service.name)
  } catch (error) {
    console.error('Error during the scraping process:', error.message)
  } finally {
    rl.close()
    process.exit(0)
  }
}

main()
