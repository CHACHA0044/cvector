/**
 * Generate a unique, contextually relevant image URL using Lorem Flickr.
 *
 * @param {string|number} seed - A unique identifier for the product (e.g. ID)
 * @param {string} name - The product name
 * @param {string} category - The category name
 * @returns {string}
 */
export function generateImageUrl(seed, name, category) {
  const cleanName = name || "";
  
  // Extract the most descriptive words (usually the last two words of the product name)
  const words = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // remove special characters
    .split(/\s+/)
    .filter(w => w.length > 2);   // remove short words like "of", "in"

  const keywords = words.slice(-2).join(",");
  const searchKeyword = keywords || category.toLowerCase() || "product";

  // Use Lorem Flickr with lock parameter to guarantee image consistency
  return `https://loremflickr.com/400/400/${searchKeyword}?lock=${seed}`;
}
