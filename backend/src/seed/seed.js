import { PrismaClient } from "@prisma/client";
import { pickCategory } from "./categories.js";
import { generateName } from "./productNames.js";
import { generatePrice } from "./priceGenerator.js";
import { generateDates } from "./dateGenerator.js";
import { generateImageUrl } from "./imageGenerator.js";

const prisma = new PrismaClient();

const TOTAL_PRODUCTS = 200000;
const BATCH_SIZE = 5000;

async function main() {
  console.log("Starting seed script...");
  const startTime = Date.now();

  // Clear existing products
  console.log("Clearing existing products...");
  await prisma.product.deleteMany({});
  console.log("Database cleared.");

  let createdCount = 0;

  // We generate in batches to optimize memory usage and database transaction sizes.
  for (let i = 0; i < TOTAL_PRODUCTS; i += BATCH_SIZE) {
    const currentBatchSize = Math.min(BATCH_SIZE, TOTAL_PRODUCTS - i);
    const productsBatch = [];

    for (let j = 0; j < currentBatchSize; j++) {
      const productId = i + j + 1; // logical sequential ID for Picsum seed differentiation
      const categoryObj = pickCategory();
      const categoryName = categoryObj.name;
      const name = generateName(categoryName);
      const price = generatePrice(categoryName);
            const { createdAt, updatedAt } = generateDates();
      const image = generateImageUrl(productId, name, categoryName);

      productsBatch.push({
        name,
        category: categoryName,
        price,
        image,
        createdAt,
        updatedAt,
      });
    }

    // Insert batch into DB
    await prisma.product.createMany({
      data: productsBatch,
    });

    createdCount += currentBatchSize;
    const progress = ((createdCount / TOTAL_PRODUCTS) * 100).toFixed(1);
    console.log(`Seeded ${createdCount}/${TOTAL_PRODUCTS} products (${progress}%)`);
  }

  const endTime = Date.now();
  const timeTakenSec = ((endTime - startTime) / 1000).toFixed(2);
  console.log(`Successfully seeded ${TOTAL_PRODUCTS} products in ${timeTakenSec} seconds.`);
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
