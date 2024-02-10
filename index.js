import axios from 'axios'
import fs from 'fs'
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

  console.log('Scraping:', url)

  const data = await page.evaluate(() => {
    const types = Array.from(document.querySelectorAll('#nutrition-facts thead th')).slice(1).map(th => th.innerText.trim().toLowerCase())
    const rows = Array.from(document.querySelectorAll('#nutrition-facts tbody tr'))
    const nutritionFacts = {}

    rows.forEach(row => {
      const td = row.querySelector('td')
      if (!td) return // Guard clause to handle missing td elements

      const nutrient = td.innerText.trim().toLowerCase()
        .replace(/\s*\/\s*\w+\s*:/, '')
        .replace(/[\s_]+/g, '')
        .trimEnd('_')
        .trim()

      const nutrientMeasureRegex = td.innerText.trim().match(/\/\s*(\w+)/)
      const nutrientMeasure = nutrientMeasureRegex ? nutrientMeasureRegex[1] : ''
      types.forEach((type, index) => {
        const valueElement = row.querySelectorAll('td')[index + 1]
        if (!valueElement) return // Safely handle missing elements
        const value = valueElement.innerText.trim()
        if (!nutritionFacts[type]) {
          nutritionFacts[type] = { nutritionFacts: {} }
        }
        nutritionFacts[type].nutritionFacts[nutrient] = `${value}${nutrientMeasure}`
      })
    })

    return types.map(type => ({ type, nutritionFacts: nutritionFacts[type].nutritionFacts }))
  })

  const mealIdentifier = url.split('/').pop()
  const match = mealIdentifier.match(/(\d+)-(.*)/)
  const id = match ? match[1] : mealIdentifier
  const name = match ? match[2] : mealIdentifier

  await browser.close()
  return { id, name, url, servings: data }
}

/**
 * The main function orchestrates the scraping process by extracting URLs, filtering for week menus, and scraping data for each week menu URL.
 */
// TODO:
// - Order the weekMenusData by id
// - Add Date
// - Add error handling
// - Check missing URLs
const main = async () => {
  try {
    const urls = await extractUrls()
    const weekMenuURLs = filterWeekMenus(urls)
    console.log('Scraping week menus:', weekMenuURLs)
    const weekMenus = await Promise.all(weekMenuURLs.map(scrapeMenu))

    const weekMenusData = {
      date: weekMenuURLs[0].match(/(\d{4}-\d{2}-\d{2})/)[0],
      numberOfWeekMenus: weekMenus.length,
      weekMenus
    }

    fs.writeFileSync('weekMenuData.json', JSON.stringify(weekMenusData, null, 2))
    console.log('Scraping completed. Data saved to weekMenuData.json')
  } catch (error) {
    console.error('Error in main function:', error)
  }
}

main()
