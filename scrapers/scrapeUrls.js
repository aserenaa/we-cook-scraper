import { weekMenuUrl } from '../config.js'
import { initializeAndNavigate } from '../utils/index.js'

/**
 * Scrapes menu links from a specific date's page on the week menu website.
 * Optionally logs messages from the page's console to the Node.js console.
 *
 * @param {string} date - The specific date to scrape menu links for, in 'YYYY-MM-DD' format.
 * @returns {Promise<Array<{href: string, text: string}>>} - A promise that resolves to an array of objects,
 * each containing the href and text of a menu link.
 */
export const scrapeMenuLinksByDate = async (date) => {
  const url = `${weekMenuUrl}/${date}`
  try {
    const { browser, page } = await initializeAndNavigate(url)

    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a.h-full'))
      if (anchors.length === 0) return []
      return anchors.map(anchor => anchor.href)
    })

    await browser.close()
    return links
  } catch (error) {
    console.error(`Error scraping ${url}:`, error)
    return []
  }
}
