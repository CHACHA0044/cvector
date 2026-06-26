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
    const { category, limit: rawLimit, cursor } = req.query;

    // Clamp limit between 1 and 50 to prevent abuse
    const limit = Math.min(Math.max(parseInt(rawLimit) || 8, 1), 50);

    // Build the WHERE clause — category filter + cursor condition
    const where = {};
    if (category && category !== "All") {
      where.category = category;
    }

    // Decode and apply cursor for keyset pagination
    // The cursor encodes the (updatedAt, id) of the last seen item.
    // We fetch rows where (updatedAt, id) < cursor using a compound condition.
    if (cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
        if (decoded && decoded.updatedAt && decoded.id) {
          where.AND = [
            {
              OR: [
                // Row has an earlier updatedAt — definitely comes after in DESC order
                { updatedAt: { lt: new Date(decoded.updatedAt) } },
                // Same updatedAt but smaller id — tiebreaker in DESC order
                {
                  updatedAt: new Date(decoded.updatedAt),
                  id: { lt: parseInt(decoded.id) },
                },
              ],
            },
          ];
        }
      } catch (err) {
        // Invalid cursor — ignore and return from the beginning
        console.error("Failed to parse cursor:", err.message);
      }
    }

    // Fetch limit + 1 to check if there are more pages without a separate COUNT query
    const products = await prisma.product.findMany({
      where,
      take: limit + 1,
      orderBy: [
        { updatedAt: "desc" },
        { id: "desc" },
      ],
    });

    const hasMore = products.length > limit;
    const data = hasMore ? products.slice(0, limit) : products;

    // Encode the cursor for the next page
    let nextCursor = null;
    if (hasMore && data.length > 0) {
      const lastItem = data[data.length - 1];
      nextCursor = Buffer.from(
        JSON.stringify({ updatedAt: lastItem.updatedAt, id: lastItem.id })
      ).toString("base64");
    }

    // Total count uses only the category filter (no cursor) so the frontend
    // can show "Showing X of Y" regardless of pagination depth.
    const countWhere = {};
    if (category && category !== "All") {
      countWhere.category = category;
    }
    const total = await prisma.product.count({ where: countWhere });

    res.json({ data, nextCursor, hasMore, total });
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
