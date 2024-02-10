/**
 * Filters the URLs to include only those that contain 'en/week-menu/'.
 * @param {string[]} urls - An array of URLs to filter.
 * @returns {string[]} An array of filtered URLs that include week menus.
 */
export const filterWeekMenus = (urls) => urls.filter(url => url.includes('en/week-menu/'))
