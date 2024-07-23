import { initializeAndNavigate } from '../../utils/index.js'

/**
 * Scrape nutrition facts from a given URL.
 *
 * @param {string} url - The URL of the page to scrape nutrition facts from.
 * @returns {Promise<Object|null>} A promise that resolves to an object containing nutrition facts or null if an error occurs.
 */
export const scrapeNutritionFacts = async (url) => {
  console.log(url)

  try {
    const { browser, page } = await initializeAndNavigate(url)

    const nutritionData = {
      id: '',
      name: '',
      url,
      periodDate: '',
      servings: {
        small: {},
        regular: {}
      }
    }

    const { name, servings } = await page.evaluate(() => {
      const nutritionFacts = {}
      const name = document.querySelector('h1[data-recipe-title]')?.innerText.trim() || 'N/A'
      const nutritionContainer = document.querySelector('div[data-test-id="recipe-nutrition"]')
      const nutritionElements = nutritionContainer.querySelectorAll('.web-dxsv06')

      nutritionElements.forEach(element => {
        const nutrientKey = element.querySelector('small')
        const nutrientValue = element.querySelector('span')
        if (nutrientKey && nutrientValue) {
          const label = nutrientKey.textContent.trim().toLowerCase().replace(/\s+/g, '_')
          const value = nutrientValue.textContent.trim().toLowerCase()
          nutritionFacts[label] = value
        }
      })

      return { name, servings: { regular: nutritionFacts } }
    })

    const urlParts = url.split('?')[0].split('-')
    const id = urlParts[urlParts.length - 1]

    // Extract the period date from the URL
    const periodDate = url.split('?week=')[1] || ''

    nutritionData.id = id
    nutritionData.name = name
    nutritionData.periodDate = periodDate
    nutritionData.servings = servings

    // Close the browser after scraping
    await browser.close()

    return nutritionData
  } catch (error) {
    console.error(`Error scraping ${url}:`, error)
    return null
  }
}
