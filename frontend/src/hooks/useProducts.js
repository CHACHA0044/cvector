import { useState, useEffect, useCallback } from "react";
import { fetchProducts, fetchCategories } from "../services/api";

/**
 * Hook for fetching products with cursor-based pagination and category filtering.
 */
export function useProducts() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("All");
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Load initial products whenever category changes
  const loadProducts = useCallback(async (cat) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchProducts({ category: cat });
      setProducts(result.data);
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
      setTotal(result.total);
    } catch (err) {
      setError(err.message || "Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more products (append)
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const result = await fetchProducts({ category, cursor });
      setProducts((prev) => [...prev, ...result.data]);
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err.message || "Failed to load more products");
    } finally {
      setLoadingMore(false);
    }
  }, [category, cursor, hasMore, loadingMore]);

  // Change category resets the list
  const changeCategory = useCallback(
    (newCategory) => {
      setCategory(newCategory);
      loadProducts(newCategory);
    },
    [loadProducts]
  );

  // Initial load
  useEffect(() => {
    loadProducts("All");
  }, [loadProducts]);

  return {
    products,
    category,
    changeCategory,
    loadMore,
    hasMore,
    total,
    loading,
    loadingMore,
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
