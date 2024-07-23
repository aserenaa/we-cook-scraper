import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../')
const DATE_PATTERN = /(\d{4})-(\d{2})-\d{2}|(\d{4})-W(\d{2})/

/**
 * Saves data to a JSON file within a specified directory organized by year, month, and meal type.
 * If the directory does not exist, it creates the directory before saving the file.
 * The data is saved in a pretty-printed JSON format.
 *
 * @param {string} mealType - The type of meal service (e.g., 'factor', 'wecook').
 * @param {string} filename - The name of the file to save the data to. This should include the .json extension
 * and be prefixed with the date in the format `weekMenuData-YYYY-MM-DD.json` or `weekMenuData-YYYY-W##.json`.
 * @param {Object} data - The data to be saved into the JSON file. This should be a valid JavaScript object.
 */
export const saveToJsonFile = (mealType, filename, data) => {
  const [, year, month, factorYear, week] = filename.match(DATE_PATTERN) || []

  if (!year && !factorYear) {
    throw new Error('Invalid filename. The filename should be prefixed with the date in the format `weekMenuData-YYYY-MM-DD.json` or `weekMenuData-YYYY-W##.json`')
  }

  const directory = year ? `${year}-${month}` : `${factorYear}-W${week}`
  const dirPath = path.join(rootDir, 'data', mealType, directory)

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }

  const filePath = path.join(dirPath, filename)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}
