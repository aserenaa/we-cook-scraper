import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../')

/**
 * Saves data to a JSON file within a specified directory. If the directory does not exist,
 * it creates the directory before saving the file. The data is saved in a pretty-printed JSON format.
 *
 * @param {string} filename - The name of the file to save the data to. This should include the .json extension.
 * @param {Object} data - The data to be saved into the JSON file. This should be a valid JavaScript object.
 */
export const saveToJsonFile = (filename, data) => {
  const dirPath = path.join(rootDir, 'data')
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
  const filePath = path.join(dirPath, filename)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}
