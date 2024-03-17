/**
 * Automates clicks on meal-related buttons within a webpage. This script is designed to work with a specific
 * HTML structure, where meals are represented as elements with a "meal" class. Each meal element is expected
 * to contain buttons for interactions and a title with the meal's name. The script performs two main actions
 * for each meal element found:
 *
 * 1. Cleas the default selections; It clicks the first button a number of times based on a value found in a child element with the class
 *    "count .num". This typically represents a predefined number of servings or portions.
 *
 * 2. It then clicks the second button according to the number of repetitions specified for the meal in the
 *    `menuRepetitions` object. This object maps meal names to the number of desired click interactions,
 *    allowing for customizable repetitions for different meals.
 *
 * Usage:
 * - Populate the `menuRepetitions` object with meal names as keys and the desired number of button click
 *   repetitions as values.
 * - Ensure this script is executed in an environment where the DOM is accessible, such as within a web browser.
 *
 * Note: Frequent or automated interactions with web elements may violate some websites' terms of service. Use
 * this script responsibly and ensure it complies with the policies of the website it interacts with.
 */

const menuRepetitions = {
  'Thai beef bowl': 2,
  'Shrimp poke bowl': 2,
  'Grilled turkey chipotle bowl': 1,
  'New Jersey-style pasta': 1,
  'Grilled glazed pork, sweet teriyaki sauce': 2,
  'Parmesan meatballs, marinara sauce': 2,
  'Southern-style beef chili': 2,
  'Grilled chicken breast, chipotle mayo': 2
  // Add more meals and their click repetitions as needed.
}

/**
 * Simulates a click event on a specified DOM element.
 * @param {Element} element The DOM element to simulate a click on.
 */
function simulateClick (element) {
  element.dispatchEvent(new window.MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window
  }))
}

/**
 * Iterates through elements with a class of "meal", simulating clicks on their buttons based on
 * predefined logic. First, it clicks the first button according to a count specified within the element.
 * Then, it clicks the second button a number of times as defined for the meal's name in the
 * `menuRepetitions` object.
 */
(function clickMealButtons () {
  const meals = document.querySelectorAll('.meal')

  meals.forEach(meal => {
    const titleElement = meal.querySelector('.title .name')
    const mealName = titleElement ? titleElement.textContent.trim() : null

    const buttons = meal.querySelectorAll('button')
    const numSpan = meal.querySelector('.count .num')
    const numRepetitionsFromSpan = numSpan ? parseInt(numSpan.textContent, 10) : 0

    // Click the first button according to the number specified in .count .num
    if (buttons.length > 0 && numRepetitionsFromSpan > 0) {
      const firstButton = buttons[0]
      for (let i = 0; i < numRepetitionsFromSpan; i++) {
        simulateClick(firstButton)
      }
    }

    // Click the second button according to the repetitions defined in `menuRepetitions`
    const repetitions = menuRepetitions[mealName]
    if (buttons.length >= 2 && repetitions) {
      const secondButton = buttons[1] // The second button is targeted for these clicks
      for (let i = 0; i < repetitions; i++) {
        simulateClick(secondButton)
      }
    }
  })
})()
