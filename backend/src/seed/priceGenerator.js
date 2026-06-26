import { getCategoryByName } from "./categories.js";

/**
 * Generate a realistic price for a given category.
 * Returns a price formatted to 2 decimal places (as a number).
 *
 * @param {string} categoryName
 * @returns {number}
 */
export function generatePrice(categoryName) {
  const cat = getCategoryByName(categoryName);
  if (!cat) return 9.99;

  const [min, max] = cat.priceRange;
  const randomPrice = Math.random() * (max - min) + min;

  // Real prices often end in .99, .95, .50, or .00.
  // Let's add some price ending realism:
  const endings = [0.99, 0.99, 0.99, 0.95, 0.50, 0.00];
  const ending = endings[Math.floor(Math.random() * endings.length)];

  // Round to nearest integer and add the ending
  let price = Math.floor(randomPrice) + ending;

  // Make sure it doesn't exceed the max or drop below min too much
  if (price < min) price = min + ending;
  if (price > max) price = max - 1 + ending;

  return parseFloat(price.toFixed(2));
}
