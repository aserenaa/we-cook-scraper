import axios from 'axios'
import puppeteer from 'puppeteer'

const sitemapUrl = 'https://www.wecookmeals.ca/sitemap.xml'

// Extract the URLs from the sitemap
const extractUrls = async () => {
  const response = await axios.get(sitemapUrl)
  const urls = response.data.match(/<loc>(.*?)<\/loc>/g)
  return urls.map((url) => url.replace(/<\/?loc>/g, ''))
}

// Filter the URLs to only include the recipes
const filterWeekMenus = (urls) => {
  return urls.filter((url) => url.includes('en/week-menu/'))
}

// Web scraping with axios and cheerio each week menu
const scrapeMenu = async (url) => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  page.on('console', msg => console.log('PAGE LOG:', msg.text()))
  await page.goto(url, { waitUntil: 'networkidle2' })

  const data = await page.evaluate(() => {
    const nutritionFacts = {}
    const types = Array.from(document.querySelectorAll('thead th')).slice(1).map(th => th.innerText.trim().toLowerCase())
    const rows = Array.from(document.querySelectorAll('#nutrition-facts tbody tr'))

    rows.forEach(row => {
      const nutrient = row.querySelector('td').innerText.trim().toLowerCase()

      // Remove unit and colon, including any variations with spaces
        .replace(/\s*\/\s*\w+\s*:/, '')
      // Replace any remaining spaces or underscores with a single underscore
        .replace(/[\s_]+/g, '')
      // Trim trailing underscores if any
        .trimEnd('_')
        // trime whitespace
        .trim()

      console.log(nutrient, row.querySelector('td').innerText)
      const nutrientMessureRegex = row.querySelector('td').innerText.trim().match(/\/\s*(\w+)/)
      const nutrientMessure = nutrientMessureRegex ? nutrientMessureRegex[1] : ''
      types.forEach((type, index) => {
        const value = row.querySelectorAll('td')[index + 1].innerText.trim() // Extract the value as is
        // Directly use 'value' without appending 'g' since it should already include the correct unit (e.g., 'g', 'mg')
        if (!nutritionFacts[type]) nutritionFacts[type] = { nutritionFacts: {} }
        nutritionFacts[type].nutritionFacts[nutrient] = `${value}${nutrientMessure}`
      })
    })

    return types.map(type => ({
      type,
      nutritionFacts: nutritionFacts[type].nutritionFacts
    }))
  })

  await browser.close()
  return {
    id: url.split('/').pop(),
    servings: data
  }
}

// Main function
const main = async () => {
  const urls = await extractUrls()
  const weekMenus = filterWeekMenus(urls)
  const weekMenu = await scrapeMenu(weekMenus[0])
  // const weekMenu = await scrapeMenu(weekMenus[0])
  console.log(weekMenus[0], JSON.stringify(weekMenu, null, 2))
}

main()

export default extractUrls
