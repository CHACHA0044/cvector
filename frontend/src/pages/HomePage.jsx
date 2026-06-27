import { useProducts, useCategories } from "../hooks/useProducts";
import CategoryFilter from "../components/CategoryFilter";
import ProductGrid from "../components/ProductGrid";
import Pagination from "../components/Pagination";
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

  return (
    <div className="home-page">
      <header className="home-page__header">
        <div className="home-page__header-inner">
          <h1 className="home-page__title">Products</h1>
          <p className="home-page__subtitle">
            Browse our collection of {total} product{total !== 1 ? "s" : ""}
          </p>
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
    </div>
  );
}
