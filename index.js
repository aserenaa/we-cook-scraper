import { scrapeMenu } from './scrapers/scrapeMenu.js'
import { scrapeMenuLinksByDate } from './scrapers/scrapeUrls.js'
import { saveToJsonFile } from './services/fileService.js'
import { getMondaysOfMonth } from './utils/index.js'

/**
 * Orchestrates the web scraping process to collect week menu data from a specified sitemap URL.
 * It first extracts all URLs from the sitemap, filters them to retain only week menu URLs,
 * and then concurrently scrapes data from each filtered URL. The collected data includes
 * the date extracted from the URL, the total number of week menus scraped, and detailed
 * information about each menu. This data is then saved to 'weekMenuData.json', overwriting
 * the file if it already exists. If no week menu URLs are found, it logs a message and exits.
 * Errors encountered during the process are caught and logged.
 */
const main = async () => {
  try {
    const currentDate = new Date()
    const currentMondaysOfMonth = getMondaysOfMonth(currentDate.getFullYear(), currentDate.getMonth())
    const weekMenuUrlsByDate = {}
    for (const date of currentMondaysOfMonth) {
      weekMenuUrlsByDate[date] = await scrapeMenuLinksByDate(date)
    }

    for (const date in weekMenuUrlsByDate) {
      const weekMenus = await Promise.all(weekMenuUrlsByDate[date].map(scrapeMenu))
      const weekMenusData = { date, numberOfWeekMenus: weekMenuUrlsByDate[date].length, weekMenus }
      saveToJsonFile(`weekMenuData-${date}.json`, weekMenusData)
      console.info(`Scraping completed for ${date}.`)
    }

    console.info('Scraping completed. Data saved to weekMenuData files.')
  } catch (error) {
    console.error('Error:', error.message)
  }
}

main()
