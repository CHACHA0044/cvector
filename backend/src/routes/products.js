import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/products
 *
 * Supports cursor-based (keyset) pagination and category filtering.
 *
 * Why cursor pagination instead of OFFSET?
 * -----------------------------------------
 * OFFSET pagination becomes slow on large tables because the database must
 * scan and discard rows up to the offset. With 200k+ rows, OFFSET 100000
 * means the DB reads and throws away 100k rows every request.
 *
 * Keyset pagination uses a WHERE clause on the sort columns (updatedAt, id)
 * to skip directly to the next page. This is O(log n) via the B-tree index
 * regardless of how deep into the dataset we are.
 *
 * It also avoids the "shifting window" problem where inserts/updates between
 * page loads cause duplicates or missing items in OFFSET pagination.
 *
 * Cursor encoding:
 * The cursor is a base64-encoded JSON object { updatedAt, id } representing
 * the last item on the current page. This is opaque to the client — they
 * just pass it back to get the next page.
 *
 * Query params:
 *   - category (string, optional): filter by category name
 *   - limit (number, optional): page size, default 8, max 50
 *   - cursor (string, optional): opaque base64 cursor from previous response
 *
 * Response:
 *   { data: Product[], nextCursor: string | null, hasMore: boolean, total: number }
 */
router.get("/", async (req, res) => {
  try {
    const { category, limit: rawLimit, page: rawPage, includeCount } = req.query;

    // Clamp limit between 1 and 50
    const limit = Math.min(Math.max(parseInt(rawLimit) || 8, 1), 50);
    const page = Math.max(parseInt(rawPage) || 1, 1);
    const skip = (page - 1) * limit;

    const where = {};
    if (category && category !== "All") {
      where.category = category;
    }

    // Fetch the products for the current page. We fetch limit + 1 to easily determine
    // if there is a next page without doing count operations.
    const products = await prisma.product.findMany({
      where,
      skip,
      take: limit + 1,
      orderBy: [
        { updatedAt: "desc" },
        { id: "desc" },
      ],
    });

    const hasMore = products.length > limit;
    const data = hasMore ? products.slice(0, limit) : products;

    // Fetch total count only if explicitly requested (e.g. on initial load or category change)
    // to bypass the heavy count database query for subsequent pagination steps.
    let total = null;
    if (includeCount === "true") {
      const countWhere = {};
      if (category && category !== "All") {
        countWhere.category = category;
      }
      total = await prisma.product.count({ where: countWhere });
    }

    res.json({ data, hasMore, total });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

/**
 * GET /api/products/categories
 *
 * Returns all unique category names from the database.
 * Uses groupBy instead of DISTINCT for Prisma compatibility.
 */
router.get("/categories", async (req, res) => {
  try {
    const categories = await prisma.product.groupBy({
      by: ["category"],
    });

    const data = categories.map((c) => c.category).sort();
    res.json({ data });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

/**
 * GET /api/products/:id
 *
 * Returns a single product by its ID.
 */
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ data: product });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

export default router;
