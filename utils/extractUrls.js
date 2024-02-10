import axios from 'axios'
import { sitemapUrl } from '../config.js'

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
