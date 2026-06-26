/**
 * Generate a unique image URL using Picsum.
 *
 * @param {string|number} seed - A unique identifier for the product (e.g. ID or index)
 * @returns {string}
 */
export function generateImageUrl(seed) {
  // Using 400x400 as requested
  return `https://picsum.photos/seed/product-${seed}/400/400`;
}
