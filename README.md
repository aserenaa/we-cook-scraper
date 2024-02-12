# We Cook Scraper

We Cook Scraper is a Node.js application designed to scrape cooking recipes from specified websites. Utilizing Puppeteer for headless browsing, this tool efficiently extracts data such as ingredients, cooking instructions, and preparation times, making it an invaluable resource for culinary enthusiasts and data analysts alike.

## Features

- **Automated Scraping**: Configured to run every first day of the month to fetch the latest week menu data.
- **Data Processing**: Extracts and filters URLs from a sitemap, then scrapes detailed menu information.
- **JSON Storage**: Saves the scraped data in a `weekMenuData.json` file within the `data` directory.
- **GitHub Actions**: Utilizes GitHub Actions for scheduled scraping and auto-updates the repository with new data.