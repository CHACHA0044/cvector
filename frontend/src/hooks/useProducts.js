import { useState, useEffect, useCallback } from "react";
import { fetchProducts, fetchCategories } from "../services/api";

/**
 * Hook for fetching products with cursor-based pagination and category filtering.
 */
export function useProducts() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const limit = 8;

  // Load products. Fetches count only if includeCount is true.
  const loadProducts = useCallback(async (cat, pageNum, includeCount = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchProducts({
        category: cat,
        page: pageNum,
        limit,
        includeCount,
      });
      setProducts(result.data);
      setHasMore(result.hasMore);
      if (includeCount && result.total !== null) {
        setTotal(result.total);
      }
    } catch (err) {
      setError(err.message || "Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const goToPage = useCallback(
    (pageNum) => {
      if (pageNum < 1) return;
      // If we know total pages and try to exceed it, clamp it
      const totalPages = Math.ceil(total / limit);
      if (totalPages > 0 && pageNum > totalPages) return;

      setPage(pageNum);
      loadProducts(category, pageNum, false); // Fetch data without the count query!
    },
    [category, total, loadProducts]
  );

  const changeCategory = useCallback(
    (newCategory) => {
      setCategory(newCategory);
      setPage(1);
      loadProducts(newCategory, 1, true); // Fetch data AND count when category changes!
    },
    [loadProducts]
  );

  // Initial load
  useEffect(() => {
    loadProducts("All", 1, true);
  }, [loadProducts]);

  return {
    products,
    category,
    changeCategory,
    page,
    goToPage,
    hasMore,
    total,
    totalPages: Math.ceil(total / limit),
    loading,
    error,
  };
}

/**
 * Hook for fetching categories.
 */
export function useCategories() {
  const [categories, setCategories] = useState(["All"]);

  useEffect(() => {
    fetchCategories()
      .then((cats) => setCategories(["All", ...cats]))
      .catch(() => setCategories(["All"]));
  }, []);

  return categories;
}
