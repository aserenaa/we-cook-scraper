import puppeteer from 'puppeteer'

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
