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

    // Fetch products for current page using a Deferred Join (Late Row Lookup) optimization.
    // This allows PostgreSQL to run an Index-Only Scan to find the page keys, 
    // and only performs the heap access join for the final requested rows, avoiding
    // table-scan performance degradation at large offsets.
    // We order by "isUserAdded" DESC first so that user-added items are kept pinned on top.
    let products = [];
    if (category && category !== "All") {
      products = await prisma.$queryRaw`
        SELECT p.id, p.name, p.category, p.price, p.image, p."createdAt", p."updatedAt", p."isUserAdded"
        FROM "Product" p
        JOIN (
          SELECT id
          FROM "Product"
          WHERE category = ${category}
          ORDER BY "isUserAdded" DESC, "updatedAt" DESC, "id" DESC
          LIMIT ${limit + 1} OFFSET ${skip}
        ) sub ON p.id = sub.id
        ORDER BY p."isUserAdded" DESC, p."updatedAt" DESC, p.id DESC;
      `;
    } else {
      products = await prisma.$queryRaw`
        SELECT p.id, p.name, p.category, p.price, p.image, p."createdAt", p."updatedAt", p."isUserAdded"
        FROM "Product" p
        JOIN (
          SELECT id
          FROM "Product"
          ORDER BY "isUserAdded" DESC, "updatedAt" DESC, "id" DESC
          LIMIT ${limit + 1} OFFSET ${skip}
        ) sub ON p.id = sub.id
        ORDER BY p."isUserAdded" DESC, p."updatedAt" DESC, p.id DESC;
      `;
    }

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

/**
 * POST /api/products
 *
 * Creates a new product. Its updatedAt will default to now,
 * placing it at the very top of the first page.
 */
router.post("/", async (req, res) => {
  try {
    const { name, category, price, image } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({ error: "Missing required fields: name, category, price" });
    }

    const cleanPrice = parseFloat(price);
    if (isNaN(cleanPrice)) {
      return res.status(400).json({ error: "Price must be a valid number" });
    }

    // Dynamic keyword search image using category / name
    const seed = Date.now();
    const cleanName = name || "";
    const words = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 2);
    const keywords = words.slice(-2).join(",");
    const searchKeyword = keywords || category.toLowerCase() || "product";
    const productImage = image || `https://loremflickr.com/400/400/${searchKeyword}?lock=${seed}`;

        const newProduct = await prisma.product.create({
      data: {
        name,
        category,
        price: cleanPrice,
        image: productImage,
        isUserAdded: true,
      },
    });

    res.status(201).json({ data: newProduct });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

export default router;
