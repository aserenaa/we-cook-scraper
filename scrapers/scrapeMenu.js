import { initializeAndNavigate } from '../utils/index.js'

/**
 * Scrapes menu data from a given URL.
 * It navigates to the URL, iterates through buttons within a swiper-slide container,
 * clicks each button, waits for the content to update, and extracts nutritional information.
 * |--------------------|
 * | Nutrition Facts    |
 * | Per bowl           |
 * |--------------------|
 * | Calories 650       |
 * | Fat 30g            |
 * | ...                |
 * |____________________|
 *
 * @param {string} url - The URL of the page to scrape data from.
 * @returns {Promise<Object|null>} A promise that resolves to an object containing the meal's ID, name, URL, and servings data,
 * including nutritional facts such as calories. Returns null if an error occurs.
 */
export const newScrapeMenu = async (url) => {
  try {
    const { browser, page } = await initializeAndNavigate(url)

    // Initialize weekMenu here to capture the URL and potentially other details
    let weekMenu = { id: '', name: '', url, servings: {} }

    // Extract the name and servings data within page.evaluate
    const { name, servings } = await page.evaluate(async () => {
      const nutrients = {}
      const buttonSelectors = Array.from(document.querySelectorAll('div.facts-container div.swiper-slide button'))
      const menuName = document.querySelector('div.bg-beige h2.text-heading-sm')?.innerText.trim() || ''

      for (const button of buttonSelectors) {
        button.click()
        await new Promise(resolve => setTimeout(resolve, 1000))

        const servingType = button.innerText.trim().toLowerCase()
        const caloriesElement = Array.from(document.querySelectorAll('div.facts-container div.facts-container span')).find(element => element.textContent.includes('Calories'))
        const factsRows = Array.from(document.querySelectorAll('div.facts-container div.facts-container span.font-bold'))
        const servingNutrients = {}

        servingNutrients.calories = caloriesElement?.nextSibling?.textContent.trim() || 'N/A'

        factsRows.forEach(row => {
          const nutrientKey = row.innerText.trim().toLowerCase()
          const nutrientValue = row.nextSibling ? row.nextSibling.textContent.trim().toLowerCase() : 'N/A'
          servingNutrients[nutrientKey] = nutrientValue
        })

        nutrients[servingType] = servingNutrients
      }

      return { name: menuName, servings: nutrients }
    })

    // Extract ID and potentially adjust the name from the URL if necessary
    const [id, ...nameParts] = url.split('/').pop().split('-')
    weekMenu = { ...weekMenu, id, name: name || nameParts.join(' ').charAt(0).toUpperCase() + nameParts.join(' ').slice(1), servings }

    await browser.close()
    return weekMenu
  } catch (error) {
    console.error(`Error scraping ${url}:`, error)
    return null
  }
}

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
export const scrapeMenu = async (url) => {
  try {
    const { browser, page } = await initializeAndNavigate(url)

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

    await browser.close()

    const [id, ...name] = url.split('/').pop().split('-')
    return { id, name: name.join(' ').charAt(0).toUpperCase() + name.join(' ').slice(1), url, servings: data }
  } catch (error) {
    console.error(`Error scraping ${url}:`, error)
    return null
  }
}
