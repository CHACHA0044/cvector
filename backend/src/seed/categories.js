/**
 * Category definitions with distribution weights and price ranges.
 * Weights control how many products each category gets — higher weight = more products.
 * Price ranges are [min, max] in USD.
 */
const CATEGORIES = [
  { name: "Electronics",    weight: 15, priceRange: [20, 1500] },
  { name: "Clothing",       weight: 10, priceRange: [10, 250] },
  { name: "Books",          weight: 8,  priceRange: [8, 60] },
  { name: "Home",           weight: 7,  priceRange: [10, 400] },
  { name: "Kitchen",        weight: 7,  priceRange: [5, 300] },
  { name: "Sports",         weight: 7,  priceRange: [15, 800] },
  { name: "Accessories",    weight: 6,  priceRange: [10, 200] },
  { name: "Beauty",         weight: 5,  priceRange: [5, 150] },
  { name: "Furniture",      weight: 5,  priceRange: [50, 1200] },
  { name: "Health",         weight: 4,  priceRange: [8, 200] },
  { name: "Office",         weight: 4,  priceRange: [10, 500] },
  { name: "Outdoor",        weight: 4,  priceRange: [15, 600] },
  { name: "Grocery",        weight: 4,  priceRange: [2, 80] },
  { name: "Toys",           weight: 4,  priceRange: [5, 250] },
  { name: "Footwear",       weight: 3,  priceRange: [20, 350] },
  { name: "Automotive",     weight: 3,  priceRange: [10, 500] },
  { name: "Garden",         weight: 3,  priceRange: [8, 400] },
  { name: "Pet Supplies",   weight: 2,  priceRange: [5, 150] },
  { name: "Stationery",     weight: 2,  priceRange: [2, 50] },
  { name: "Music",          weight: 2,  priceRange: [10, 800] },
];

/**
 * Build a weighted list where each category appears proportionally to its weight.
 * This allows O(1) random category selection with natural distribution.
 */
function buildWeightedCategoryList() {
  const list = [];
  for (const cat of CATEGORIES) {
    for (let i = 0; i < cat.weight; i++) {
      list.push(cat);
    }
  }
  return list;
}

const weightedList = buildWeightedCategoryList();

/** Pick a random category respecting the weight distribution. */
export function pickCategory() {
  return weightedList[Math.floor(Math.random() * weightedList.length)];
}

/** Get a category config by name. */
export function getCategoryByName(name) {
  return CATEGORIES.find((c) => c.name === name);
}

/** Get all category names sorted alphabetically. */
export function getAllCategoryNames() {
  return CATEGORIES.map((c) => c.name).sort();
}

export default CATEGORIES;
