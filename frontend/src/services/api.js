import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

/**
 * Fetch products with cursor-based pagination and optional category filter.
 */
export async function fetchProducts({ category, limit = 8, page = 1, includeCount = false } = {}) {
  const params = { limit, page };
  if (category && category !== "All") params.category = category;
  if (includeCount) params.includeCount = true;

  const { data } = await api.get("/products", { params });
  return data;
}

/**
 * Fetch all available categories.
 */
export async function fetchCategories() {
  const { data } = await api.get("/products/categories");
  return data.data;
}
