import puppeteer from 'puppeteer'

/**
 * Initializes Puppeteer browser and page, and navigates to the given URL.
 * @param {string} url - The URL to navigate to.
 * @returns {Promise<{browser: puppeteer.Browser, page: puppeteer.Page}>} An object containing the browser and page instances.
 */
export const initializeAndNavigate = async (url) => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto(url, { waitUntil: 'networkidle2' })
  return { browser, page }
}
