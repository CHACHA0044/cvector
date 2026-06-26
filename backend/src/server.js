import express from "express";
import cors from "cors";
import productsRouter from "./routes/products.js";

const app = express();
const PORT = process.env.PORT || 3001;

/*
 * CORS Configuration
 * ------------------
 * In production, we restrict origins to the deployed frontend URL.
 * In development, we allow all origins for convenience.
 * Render injects NODE_ENV=production and the frontend URL can be set via
 * FRONTEND_URL env var. If neither is set, we default to allowing all.
 */
const corsOptions = {
  origin: process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL || "*"
    : "*",
  methods: ["GET"],
};
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use("/api/products", productsRouter);

// Health check — used by Render to verify the service is alive
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
