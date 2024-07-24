import { initializeAndNavigate } from '../../utils/index.js'

/**
 * Scrapes menu data from a given WeCook URL.
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
export const scrapeMenu = async (url) => {
  try {
    const { browser, page } = await initializeAndNavigate(url)

    let weekMenu = { id: '', name: '', url, servings: {} }

    const { name, servings } = await page.evaluate(async () => {
      const nutrients = {}
      const buttonSelectors = Array.from(document.querySelectorAll('div.page-menu-swiper div.swiper-wrapper div.swiper-slide button'))
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
          let nutrientValue = row.nextSibling ? row.nextSibling.textContent.trim().toLowerCase() : 'N/A'
          nutrientValue = nutrientValue.replace(/\s+/g, '')
          servingNutrients[nutrientKey] = nutrientValue
        })

        nutrients[servingType] = servingNutrients
      }

      return { name: menuName, servings: nutrients }
    })

    const [id, ...nameParts] = url.split('/').pop().split('-')
    weekMenu = { ...weekMenu, id, name: name || nameParts.join(' ').charAt(0).toUpperCase() + nameParts.join(' ').slice(1), servings }

    await browser.close()
    return weekMenu
  } catch (error) {
    console.error(`Error scraping ${url}:`, error)
    return null
  }
}
