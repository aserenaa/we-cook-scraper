import { createInterface } from 'readline'
import { newScrapeMenu, scrapeMenuLinksByDate } from './scrapers/index.js'
import { saveToJsonFile } from './services/fileService.js'
import { getMondaysOfMonth, isValidMonday } from './utils/index.js'

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
})

/**
 * Prompts the user with a question and returns the response.
 * @param {string} question - The question to prompt the user with.
 * @returns {Promise<string>} A promise that resolves with the user's response.
 */
const askQuestion = (question) => new Promise(resolve => rl.question(question, resolve))

/**
 * Orchestrates the web scraping process based on user selection. It supports scraping for a specific date
 * or for Mondays of the current and next month. The scraped data is saved to individual JSON files named
 * after the date of the week menu.
 */
const main = async () => {
  try {
    const choice = await askQuestion('Select option:\n1. Run for a specific date\n2. Run for the current and next month\nEnter option number (1 or 2): ')

    let datesToScrape = []

    switch (choice.trim()) {
      case '1': {
        const validDates = []
        const specificDates = await askQuestion('Enter Monday dates separated by space with the format YYYY-MM-DD (e.g. 2021-08-02 2021-08-09): ')

        const inputDates = specificDates.split(' ')
        for (const dateStr of inputDates) {
          if (isValidMonday(dateStr)) {
            validDates.push(dateStr)
          } else {
            console.error(`Invalid or not a Monday date: ${dateStr}`)
          }
        }

        if (validDates.length === 0) {
          console.error('No valid Monday dates were entered. Exiting.')
          rl.close()
          return
        }

        datesToScrape = validDates
        console.info('Running for specific dates:', datesToScrape)
        break
      }
      case '2': {
        const currentDate = new Date()
        datesToScrape = getMondaysOfMonth(currentDate.getFullYear(), currentDate.getMonth())
          .concat(getMondaysOfMonth(currentDate.getFullYear(), currentDate.getMonth() + 1))
        console.info('Running for the current and next month')
        break
      }
      default: {
        console.error('Invalid option. Exiting.')
        rl.close()
        return
      }
    }

    for (const date of datesToScrape) {
      const weekMenuUrls = await scrapeMenuLinksByDate(date)
      if (weekMenuUrls.length === 0) {
        console.log(`No URLs found for ${date}. Skipping.`)
        continue
      }
      const weekMenus = await Promise.all(weekMenuUrls.map(url => newScrapeMenu(url)))
      await saveToJsonFile(`weekMenuData-${date}.json`, { date, numberOfWeekMenus: weekMenus.length, weekMenus })
      console.info(`Scraping completed for ${date}. Data saved to weekMenuData-${date}.json`)
    }

    console.info('Scraping process completed.')
  } catch (error) {
    console.error('Error during the scraping process:', error.message)
  } finally {
    rl.close()
  }
}

main()
