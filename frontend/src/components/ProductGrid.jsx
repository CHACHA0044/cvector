import ProductCard from "./ProductCard";
import "./ProductGrid.css";

export default function ProductGrid({ products }) {
  return (
    <div className="product-grid" id="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
