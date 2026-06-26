# CVector — E-Commerce Product Browser

A full-stack product catalogue application built as a take-home assignment. Features **200,000 products** with cursor-based pagination, category filtering, and a responsive React frontend.

## Architecture

```
cvector/
├── backend/               # Express.js API server
│   ├── prisma/            # Database schema & migrations
│   │   └── schema.prisma  # Product model + indexes
│   └── src/
│       ├── routes/        # API route handlers
│       │   └── products.js
│       ├── seed/          # Data generation modules
│       │   ├── categories.js
│       │   ├── productNames.js
│       │   ├── priceGenerator.js
│       │   ├── dateGenerator.js
│       │   ├── imageGenerator.js
│       │   └── seed.js
│       └── server.js      # Express entry point
│
└── frontend/              # React + Vite SPA
    └── src/
        ├── components/    # Reusable UI components
        ├── hooks/         # Custom React hooks
        ├── pages/         # Page-level components
        └── services/      # API client (Axios)
```

## Tech Stack

| Layer      | Technology            | Deployment  |
|------------|----------------------|-------------|
| Frontend   | React + Vite         | Vercel      |
| Backend    | Node.js + Express    | Render      |
| Database   | PostgreSQL           | Supabase    |
| ORM        | Prisma 5             |             |

## Local Setup

### Prerequisites

- Node.js 18+
- npm 9+

### 1. Clone the repository

```bash
git clone https://github.com/CHACHA0044/cvector.git
cd cvector
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file (see `.env.example`):

```env
DATABASE_URL="postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres"
PORT=3001
NODE_ENV=development
```

Push the schema and seed the database:

```bash
npx prisma db push        # Create tables + indexes
npm run seed               # Generate 200,000 products (~25-60 seconds)
```

Start the dev server:

```bash
npm run dev                # http://localhost:3001
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create a `.env` file (see `.env.example`):

```env
VITE_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Start the dev server:

```bash
npm run dev                # http://localhost:5173
```

## Environment Variables

### Backend

| Variable       | Description                                  | Required |
|----------------|----------------------------------------------|----------|
| `DATABASE_URL` | PostgreSQL connection string (runtime)        | Yes      |
| `DIRECT_URL`   | PostgreSQL direct connection (migrations)     | Yes      |
| `PORT`         | Server port (default: 3001)                   | No       |
| `NODE_ENV`     | `development` or `production`                 | No       |
| `FRONTEND_URL` | Deployed frontend URL for CORS (production)   | No       |

### Frontend

| Variable                  | Description                         | Required |
|---------------------------|-------------------------------------|----------|
| `VITE_API_URL`            | Backend API base URL                | Yes      |
| `VITE_SUPABASE_URL`       | Supabase project URL                | No       |
| `VITE_SUPABASE_ANON_KEY`  | Supabase anonymous key              | No       |

## Prisma Commands

```bash
npx prisma db push          # Push schema changes to database (no migration history)
npx prisma migrate dev      # Create a migration and apply it (development)
npx prisma migrate deploy   # Apply pending migrations (production)
npx prisma generate         # Regenerate Prisma Client
npx prisma studio           # Open database GUI
```

## Seed Script

```bash
npm run seed
```

Generates **200,000 realistic products** across 20 categories using modular generators:

- **Batched inserts**: Uses `createMany()` with batches of 5,000 to minimize DB round trips
- **Realistic names**: Combines category-specific adjectives, materials, and product types
- **Realistic prices**: Category-appropriate ranges with natural price endings (.99, .95, .50)
- **Realistic dates**: Timestamps spanning 3 years with proper `createdAt ≤ updatedAt`
- **Unique images**: Picsum URLs with per-product seeds for visual variety

## API Documentation

### `GET /api/health`

Health check endpoint for monitoring.

```json
{ "status": "ok", "timestamp": "2026-06-26T12:00:00.000Z" }
```

### `GET /api/products`

Fetches products with cursor-based pagination and optional category filtering.

**Query Parameters:**

| Param      | Type   | Default | Description                              |
|------------|--------|---------|------------------------------------------|
| `limit`    | number | 8       | Page size (1–50)                         |
| `category` | string | –       | Filter by category name                  |
| `cursor`   | string | –       | Opaque cursor from previous response     |

**Response:**

```json
{
  "data": [
    {
      "id": 12345,
      "name": "Wireless Gaming Mouse",
      "category": "Electronics",
      "price": 49.99,
      "image": "https://picsum.photos/seed/product-12345/400/400",
      "createdAt": "2024-03-15T10:30:00.000Z",
      "updatedAt": "2026-06-20T14:15:00.000Z"
    }
  ],
  "nextCursor": "eyJ1cGRhdGVkQXQiOi...",
  "hasMore": true,
  "total": 200000
}
```

### `GET /api/products/categories`

Returns all unique category names.

```json
{ "data": ["Accessories", "Automotive", "Beauty", "Books", ...] }
```

### `GET /api/products/:id`

Returns a single product by ID.

## Cursor-Based Pagination

### Why keyset pagination instead of OFFSET?

| Aspect                  | OFFSET              | Cursor (Keyset)      |
|------------------------|---------------------|----------------------|
| Performance at page 1  | Fast                | Fast                 |
| Performance at page 1000| Slow (scans 8000 rows) | Still fast (index seek) |
| Consistency            | Duplicates/gaps on insert/update | Stable — no duplicates or missing items |
| Implementation         | Simple              | Slightly more complex |

**OFFSET** works by counting rows: `SKIP 1000 LIMIT 10` means the database reads 1010 rows and discards the first 1000. At deep pages with 200k rows, this becomes extremely slow.

**Keyset/cursor** pagination uses a `WHERE` clause on the sort columns:

```sql
WHERE (updatedAt, id) < (cursor_updatedAt, cursor_id)
ORDER BY updatedAt DESC, id DESC
LIMIT 10
```

This jumps directly to the right position via the B-tree index — O(log n) regardless of page depth.

### Cursor format

The cursor is a **base64-encoded JSON** object containing the `updatedAt` and `id` of the last item on the current page. It is opaque to the frontend — the client simply passes it back in the next request.

### No duplicates or missing items

Because the cursor is based on the actual sort values rather than a row count, inserting or updating products between page loads cannot cause items to shift position. This guarantees:

- **No duplicate products** across pages
- **No skipped products** when data changes

## Database Indexing

Two composite indexes support the query patterns:

```sql
-- Supports: paginating all products (sorted by updatedAt DESC, id DESC)
CREATE INDEX idx_product_updated_id ON "Product" ("updatedAt" DESC, "id" DESC);

-- Supports: filtering by category + pagination
-- PostgreSQL can use this index for both category-filtered and unfiltered queries
CREATE INDEX idx_product_category_updated_id ON "Product" ("category", "updatedAt" DESC, "id" DESC);
```

### Why these specific indexes?

The API sorts by `(updatedAt DESC, id DESC)` and optionally filters by `category`. Without indexes, PostgreSQL would need to perform a sequential scan over 200k rows and sort them — which is slow.

The compound index `(category, updatedAt DESC, id DESC)` is especially important because:

1. It **covers** the category filter as the leftmost column
2. The remaining columns match the sort order exactly
3. PostgreSQL can satisfy both the filter and the sort from a single index scan

The `(updatedAt DESC, id DESC)` index handles the unfiltered case efficiently.

## Tradeoffs

| Decision | Why | Alternative considered |
|----------|-----|----------------------|
| Prisma ORM | Type-safe queries, easy migrations, great DX | Raw SQL — more control but harder to maintain |
| SQLite for local dev → PostgreSQL for prod | Supabase provides managed Postgres; local dev could use either | Docker Postgres — heavier setup for reviewers |
| Base64 cursor encoding | Opaque to client, tamper-evident, simple | Signed JWT cursors — overkill for this use case |
| `createMany` batches of 5000 | Balances memory usage vs. DB round trips | Single massive INSERT — could OOM; row-by-row — too slow |
| Picsum seeded images | No local storage needed, unique per product | Unsplash — requires API key; local images — increases repo size |
| No authentication | Assignment scope — product browser only | Supabase Auth — unnecessary complexity for this demo |
| `take: limit + 1` pattern | Avoids an extra COUNT query to determine `hasMore` | Separate COUNT — doubles query load on every page |

## Deployment

### Backend → Render

1. Create a **Web Service** on [Render](https://render.com)
2. Connect the GitHub repository
3. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add environment variables: `DATABASE_URL`, `DIRECT_URL`, `NODE_ENV=production`, `FRONTEND_URL`

### Frontend → Vercel

1. Import the GitHub repository on [Vercel](https://vercel.com)
2. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`

### Database → Supabase

The database is already hosted on Supabase. Connection strings are configured via environment variables. No additional setup is needed after the initial schema push and seed.

## Future Improvements

- **Search**: Add full-text search using PostgreSQL `tsvector` or Supabase's built-in search
- **Product detail page**: Click a card to see full product details
- **Sorting options**: Allow sorting by price, name, or date
- **Price range filter**: Slider or input for min/max price
- **Caching**: Add Redis or in-memory cache for category list and product counts
- **Rate limiting**: Protect the API from abuse
- **Testing**: Add integration tests for the API endpoints
- **Error monitoring**: Integrate Sentry for production error tracking
