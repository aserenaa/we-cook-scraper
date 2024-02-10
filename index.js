import { scrapeMenu } from './scrapers/scrapeMenu.js'
import { saveToJsonFile } from './services/fileService.js'
import { extractUrls, filterWeekMenus } from './utils/index.js'

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
    console.log('Scraping week menus...')
    const urls = await extractUrls()
    const weekMenuURLs = filterWeekMenus(urls)
    if (!weekMenuURLs.length) {
      console.log('No week menus found.')
      return
    }

    const weekMenus = await Promise.all(weekMenuURLs.map(scrapeMenu))
    const date = weekMenuURLs[0].match(/(\d{4}-\d{2}-\d{2})/)?.[0] || 'Unknown Date'
    const weekMenusData = { date, numberOfWeekMenus: weekMenus.length, weekMenus }

    saveToJsonFile('weekMenuData.json', weekMenusData)
    console.log('Scraping completed. Data saved to weekMenuData.json')
  } catch (error) {
    console.error('Error:', error.message)
  }
}

main()
