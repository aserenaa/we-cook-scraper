/**
 * Script to automatically click on buttons corresponding to meals based on the repetitions defined.
 * Iterates through a list of meals, finds the associated button for each meal within the DOM,
 * and clicks the button the specified number of times. This script assumes that the target button
 * to click is always the second button within the meal's element and that each meal element is
 * contained within a div with a class of "meal".
 *
 * Usage:
 * - Define meal names and their click repetitions in the menuRepetitions object.
 * - Ensure the script is executed in an environment where the document object is available,
 *   such as within a browser.
 *
 * Note: Frequent or automated interactions with a website's UI elements may be against the
 * website's terms of service. Use responsibly and ensure compliance with website policies.
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
}

/**
 * Simulates a click event on the specified DOM element.
 * @param {Element} element - The DOM element to simulate a click on.
 */
function simulateClick (element) {
  element.dispatchEvent(new window.MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window
  }))
}

/**
 * Executes meal button clicking according to the specifications.
 * For each meal:
 * 1. Clicks the first button based on the number indicated in span.num for each meal.
 * 2. Then clicks the second button based on the repetitions defined in the menuRepetitions object.
 */
(function clickMealButtons () {
  const meals = document.querySelectorAll('.meal')

  meals.forEach(meal => {
    const titleElement = meal.querySelector('.title .name')
    const mealName = titleElement ? titleElement.textContent.trim() : null

    const buttons = meal.querySelectorAll('button')
    const numSpan = meal.querySelector('.count .num')
    const numRepetitionsFromSpan = numSpan ? parseInt(numSpan.textContent, 10) : 0

    // Click the first button based on the number in span.num
    if (buttons.length > 0 && numRepetitionsFromSpan > 0) {
      const firstButton = buttons[0]
      for (let i = 0; i < numRepetitionsFromSpan; i++) {
        simulateClick(firstButton)
      }
    }

    // Use the meal name to directly access the repetition count for the second button
    const repetitions = menuRepetitions[mealName]
    if (buttons.length >= 2 && repetitions) {
      const secondButton = buttons[1] // The second button
      for (let i = 0; i < repetitions; i++) {
        simulateClick(secondButton)
      }
    }
  })
})()
