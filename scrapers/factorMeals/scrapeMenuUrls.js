import process from 'process'
import { mealServices } from '../../config.js'
import { initializeAndNavigate } from '../../utils/index.js'

// Increase the maximum number of listeners
process.setMaxListeners(20)

/**
 * Scrape menu links for a given period from Factor Meals.
 *
 * @param {string} period - The period for which to scrape the menu links.
 * @returns {Promise<string[]>} A promise that resolves to an array of unique menu links.
 */
export const scrapeMenuLinksByPeriod = async (period) => {
  const url = `${mealServices.factorMeals.weekMenuUrl}/${period}`
  try {
    const { browser, page } = await initializeAndNavigate(url)

    // Increase navigation timeout
    await page.setDefaultNavigationTimeout(60000)

    const links = await page.evaluate(async () => {
      const buttonSelector = 'div.web-riauoa button.sc-e95c4911-0.hFDzbe'

      let buttonLoadMoreMeals = document.querySelector(buttonSelector)
      while (buttonLoadMoreMeals) {
        buttonLoadMoreMeals.click()
        await new Promise(resolve => setTimeout(resolve, 1000)) // wait for new content to load
        buttonLoadMoreMeals = document.querySelector(buttonSelector)
      }

      const anchors = Array.from(document.querySelectorAll('div[data-recipe-card] a'))
      const hrefs = anchors.map(anchor => anchor.href)

      // Use Set to remove duplicates
      return Array.from(new Set(hrefs))
    })

    await browser.close()
    return links
  } catch (error) {
    console.error(`Error scraping ${url}:`, error)
    return []
  }
}
