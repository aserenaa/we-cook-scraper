import axios from 'axios'
import fs from 'fs'
import puppeteer from 'puppeteer'

const sitemapUrl = 'https://www.wecookmeals.ca/sitemap.xml'

/**
 * Fetches and extracts URLs from a specified sitemap URL. It attempts to retrieve the sitemap content
 * using an HTTP GET request and then parses the content to extract URLs. Each URL found within the
 * <loc> tags of the sitemap XML is extracted, cleaned of any surrounding tags, and returned in an array.
 * If the request fails or parsing errors occur, it logs the error and returns an empty array.
 *
 * @returns {Promise<string[]>} A promise that resolves with an array of string URLs extracted from the sitemap.
 * If an error occurs during fetch or parsing, the promise resolves with an empty array.
 */
const extractUrls = async () => {
  try {
    const response = await axios.get(sitemapUrl)
    return response.data.match(/<loc>(.*?)<\/loc>/g)?.map(url => url.replace(/<\/?loc>/g, '')) || []
  } catch (error) {
    console.error('Error extracting URLs:', error)
    return []
  }
}

/**
 * Filters the URLs to include only those that contain 'en/week-menu/'.
 * @param {string[]} urls - An array of URLs to filter.
 * @returns {string[]} An array of filtered URLs that include week menus.
 */
const filterWeekMenus = (urls) => urls.filter(url => url.includes('en/week-menu/'))

/**
 * Scrapes menu data from a specified URL using Puppeteer. It navigates to the given URL,
 * waits for the page to load, and then extracts menu information based on the structure
 * of the '#nutrition-facts' table within the page. This includes nutritional types and their
 * respective values. The method also parses the meal's ID and name from the URL.
 * | Nutrition Facts | Serving Size: Small  | Serving Size: Regular |
 * |-----------------|----------------------|-----------------------|
 * | Calories        | 100                  | 200                   |
 * | Fat             | 10g                  | 20g                   |
 * | ...             | ...                  | ...                   |
 * The function ensures the browser is closed after scraping is complete or if an error occurs,
 * to prevent resource leakage. In case of errors during scraping, it logs the error and returns null.
 *
 * @param {string} url - The URL of the week-menu page to scrape data from.
 * @returns {Promise<Object|null>} A promise that resolves to an object containing the meal's ID,
 * name, URL, and servings data extracted from the nutrition facts table. Returns null if an error occurs.
 */
const scrapeMenu = async (url) => {
  let browser
  try {
    browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle2' })

    const data = await page.evaluate(() => {
      const servingTypes = Array.from(document.querySelectorAll('#nutrition-facts thead th')).slice(1).map(th => th.innerText.trim().toLowerCase())
      const rows = Array.from(document.querySelectorAll('#nutrition-facts tbody tr'))

      return rows.reduce((acc, row) => {
        const nutrientText = row.querySelector('td')?.innerText.trim().toLowerCase()
        const nutrient = nutrientText
          .replace(/\s*\/\s*\w+\s*:?/, '')
          .replace(/\s+/g, '_')
          .replace(/_+$/, '')
          .replace(/:$/, '')
          .replace(/_$/, '')

        const measure = nutrientText?.match(/\/\s*(\w+)/)?.[1] || ''

        servingTypes.forEach((type, index) => {
          const value = row.querySelectorAll('td')[index + 1]?.innerText.trim()
          acc[type] = acc[type] || {}
          acc[type][nutrient] = `${value}${measure}`
        })

        return acc
      }, {})
    })

    const [id, ...name] = url.split('/').pop().split('-')
    return { id, name: name.join(' ').charAt(0).toUpperCase() + name.join(' ').slice(1), url, servings: data }
  } catch (error) {
    console.error(`Error scraping ${url}:`, error)
    return null
  } finally {
    await browser?.close()
  }
}

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

    fs.writeFileSync('weekMenuData.json', JSON.stringify(weekMenusData, null, 2))
    console.log('Scraping completed. Data saved to weekMenuData.json')
  } catch (error) {
    console.error('Error in main function:', error)
  }
}

main()
