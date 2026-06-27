import { useState } from "react";
import { useProducts, useCategories } from "../hooks/useProducts";
import CategoryFilter from "../components/CategoryFilter";
import ProductGrid from "../components/ProductGrid";
import Pagination from "../components/Pagination";
import AddProductModal from "../components/AddProductModal";
import { LoadingState, EmptyState, ErrorState } from "../components/StatusStates";
import "./HomePage.css";

export default function HomePage() {
  const {
    products,
    category,
    changeCategory,
    page,
    goToPage,
    totalPages,
    total,
    loading,
    error,
  } = useProducts();

  const categories = useCategories();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // When a new product is successfully added, we reset pagination to Page 1
  // of the category the product belongs to, displaying it immediately at the top.
  const handleProductAdded = (newProduct) => {
    changeCategory(newProduct.category);
  };

  return (
    <div className="home-page">
      <header className="home-page__header">
        <div className="home-page__header-inner">
          <div className="home-page__header-left">
            <h1 className="home-page__title">Products</h1>
            <p className="home-page__subtitle">
              Browse our collection of {total} product{total !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            className="home-page__add-btn"
            onClick={() => setIsModalOpen(true)}
            id="add-product-btn"
          >
            <span className="home-page__add-btn-icon">+</span> Add Product
          </button>
        </div>
      </header>

      <main className="home-page__main">
        <div className="home-page__toolbar" id="toolbar">
          <CategoryFilter
            categories={categories}
            selected={category}
            onChange={changeCategory}
          />
          {!loading && products.length > 0 && (
            <span className="home-page__count">
              Showing Page {page} of {totalPages} ({products.length} items)
            </span>
          )}
        </div>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={() => changeCategory(category)}
          />
        ) : products.length === 0 ? (
          <EmptyState category={category} />
        ) : (
          <>
            <ProductGrid products={products} />
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          </>
        )}
      </main>

      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={categories}
        onProductAdded={handleProductAdded}
      />
    </div>
  );
}
