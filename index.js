import axios from 'axios'

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

// Print the URLs to the console
const printUrls = async () => {
  const urls = await extractUrls()
  const weekMenus = filterWeekMenus(urls)
  console.log(weekMenus)
}

printUrls()

export default extractUrls
