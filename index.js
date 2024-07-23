import ora from 'ora'
import { createInterface } from 'readline'
import { mealServices } from './config.js'
import { factorScrapeMenuLinksByPeriod, factorScrapeNutritionFacts, newWeCookScrapeMenu, weCookScrapeMenuLinksByDate } from './scrapers/index.js'
import { saveToJsonFile } from './services/fileService.js'
import { getMondaysOfMonth } from './utils/index.js'

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
 * @param {string} format - The date format ('weCookMeals' or 'factorMeals').
 * @returns {Array<string>} An array of valid Monday dates.
 */
const getValidMondays = (dateStrs, format) => {
  if (format === 'weCookMeals') {
    return dateStrs.filter(dateStr => {
      return true
    })
  } else if (format === 'factorMeals') {
    const factorDateRegex = /^\d{4}-W\d{2}$/
    return dateStrs.filter(dateStr => {
      if (!factorDateRegex.test(dateStr)) {
        console.error(`Invalid factor date format: ${dateStr}`)
        return false
      }
      return true
    })
  }
}

/**
 * Converts a standard date format (YYYY-MM-DD) to the factor format (YYYY-W##).
 * @param {string} dateStr - The date string to convert.
 * @returns {string} The converted date string in factor format.
 */
const convertToFactorFormat = (dateStr) => {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const week = Math.ceil((((date - new Date(year, 0, 1)) / 86400000) + new Date(year, 0, 1).getDay() + 1) / 7)
  return `${year}-W${week.toString().padStart(2, '0')}`
}

const selectServiceToScrape = async () => {
  const services = Object.values(mealServices)
  console.log('Select a service to scrape:')
  services.forEach((service, index) => console.log(`${index + 1}. ${service.name}`))

  const choice = await askQuestion(`Enter option number (1-${services.length}): `)
  const selectedServiceIndex = parseInt(choice.trim()) - 1
  if (isNaN(selectedServiceIndex) || selectedServiceIndex < 0 || selectedServiceIndex >= services.length) {
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
  const commandLineArgs = process.argv.slice(2)
  const dateFormat = service.name === 'Factor Meals' ? 'factorMeals' : 'weCookMeals'

  if (commandLineArgs.length > 0) {
    return getValidMondays(commandLineArgs, dateFormat)
  }

  const choice = await askQuestion('Select option:\n1. Run for a specific date\n2. Run for the current and next month\nEnter option number (1 or 2): ')
  switch (choice.trim()) {
    case '1': {
      const specificDates = await askQuestion('Enter Monday dates separated by space with the format YYYY-MM-DD (e.g. 2021-08-02 2021-08-09): ')
      return getValidMondays(specificDates.split(' '), dateFormat)
    }

    case '2': {
      const currentDate = new Date()
      const mondays = getMondaysOfMonth(currentDate.getFullYear(), currentDate.getMonth())
        .concat(getMondaysOfMonth(currentDate.getFullYear(), currentDate.getMonth() + 1))
      if (dateFormat === 'factorMeals') {
        return mondays.map(convertToFactorFormat)
      }
      return mondays
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

      const scrapeMenu = serviceName === 'Factor Meals' ? factorScrapeNutritionFacts : newWeCookScrapeMenu
      const weekMenus = await Promise.all(weekMenuUrls.map(scrapeMenu))
      await saveToJsonFile(serviceName.toLowerCase(), `weekMenuData-${date}.json`, { date, numberOfWeekMenus: weekMenus.length, weekMenus })
      spinner.succeed(`Scraping completed for ${date}. \nData saved to weekMenuData-${date}.json`)
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
    if (datesToScrape.length === 0) {
      console.error('No valid dates to scrape. Exiting.')
      return
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
