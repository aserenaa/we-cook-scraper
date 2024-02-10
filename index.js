import axios from 'axios'
import puppeteer from 'puppeteer'

const sitemapUrl = 'https://www.wecookmeals.ca/sitemap.xml'

/**
 * Fetches and extracts URLs from the given sitemap URL.
 * @returns {Promise<string[]>} A promise that resolves to an array of URLs extracted from the sitemap.
 */
const extractUrls = async () => {
  const response = await axios.get(sitemapUrl)
  const urls = response.data.match(/<loc>(.*?)<\/loc>/g) || []
  return urls.map(url => url.replace(/<\/?loc>/g, ''))
}

/**
 * Filters the URLs to include only those that contain 'en/week-menu/'.
 * @param {string[]} urls - An array of URLs to filter.
 * @returns {string[]} An array of filtered URLs that include week menus.
 */
const filterWeekMenus = (urls) => urls.filter(url => url.includes('en/week-menu/'))

/**
 * Scrapes the menu data from a given URL using Puppeteer.
 * @param {string} url - The URL to scrape data from.
 * @returns {Promise<Object>} A promise that resolves to an object containing the id and servings data.
 */

const scrapeMenu = async (url) => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  await page.goto(url, { waitUntil: 'networkidle2' })

  const data = await page.evaluate(() => {
    const types = Array.from(document.querySelectorAll('#nutrition-facts thead th')).slice(1).map(th => th.innerText.trim().toLowerCase())
    const rows = Array.from(document.querySelectorAll('#nutrition-facts tbody tr'))
    const nutritionFacts = {}

    rows.forEach(row => {
      const td = row.querySelector('td')
      if (!td) {
        console.log(`No td element found on ${url}`)
        return // Guard clause to handle missing td elements
      }
      const nutrient = td.innerText.trim().toLowerCase()
        .replace(/\s*\/\s*\w+\s*:/, '')
        .replace(/[\s_]+/g, '')
        .trimEnd('_')
        .trim()

      const nutrientMeasureRegex = td.innerText.trim().match(/\/\s*(\w+)/)
      const nutrientMeasure = nutrientMeasureRegex ? nutrientMeasureRegex[1] : ''
      types.forEach((type, index) => {
        const valueElement = row.querySelectorAll('td')[index + 1]
        if (!valueElement) {
          console.log(`No value element found for ${type} ${nutrient} on ${url}`)
          return // Safely handle missing elements
        }
        const value = valueElement.innerText.trim()
        if (!nutritionFacts[type]) {
          nutritionFacts[type] = { nutritionFacts: {} }
        }
        nutritionFacts[type].nutritionFacts[nutrient] = `${value}${nutrientMeasure}`
      })
    })

    return types.map(type => ({ type, nutritionFacts: nutritionFacts[type].nutritionFacts }))
  })

  await browser.close()
  return { id: url.split('/').pop(), servings: data }
}

/**
 * The main function orchestrates the scraping process by extracting URLs, filtering for week menus, and scraping data for each week menu URL.
 */
const main = async () => {
  try {
    const urls = await extractUrls()
    const weekMenuURLs = filterWeekMenus(urls)
    const weekMeals = await scrapeMenu(weekMenuURLs[0])
    console.log(JSON.stringify(weekMeals, null, 2))
    // for (const menuUrl of weekMenus) {
    //   const weekMenu = await scrapeMenu(menuUrl)
    //   console.log(menuUrl, JSON.stringify(weekMenu, null, 2))
    // }
  } catch (error) {
    console.error('Error in main function:', error)
  }
}

main()
