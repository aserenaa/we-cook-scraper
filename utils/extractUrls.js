import axios from 'axios'
import { sitemapUrl, weekMenuUrl } from '../config.js'

/**
 * Fetches and extracts URLs from a specified sitemap URL. It attempts to retrieve the sitemap content
 * using an HTTP GET request and then parses the content to extract URLs. Each URL found within the
 * <loc> tags of the sitemap XML is extracted, cleaned of any surrounding tags, and returned in an array.
 * If the request fails or parsing errors occur, it logs the error and returns an empty array.
 *
 * @returns {Promise<string[]>} A promise that resolves with an array of string URLs extracted from the sitemap.
 * If an error occurs during fetch or parsing, the promise resolves with an empty array.
 */
export const extractUrls = async () => {
  try {
    const response = await axios.get(sitemapUrl)
    return response.data.match(/<loc>(.*?)<\/loc>/g)?.map(url => url.replace(/<\/?loc>/g, '')) || []
  } catch (error) {
    throw new Error(`Error extracting URLs: ${error}`)
  }
}

/**
 * Constructs a URL for a week menu page using the specified date. The URL is constructed by appending
 * the date to the base week menu URL. The date is formatted as 'YYYY-MM-DD' and is used as the path
 * parameter in the URL.
 *
 * @param {string} date A string representing the date in 'YYYY-MM-DD' format.
 * @returns {string} A string URL for a week menu page.
 */
export const buildUrlByDate = (date) => {
  return `${weekMenuUrl}/${date}`
}
