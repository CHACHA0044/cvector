import "./ProductCard.css";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatPrice(price) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export default function ProductCard({ product, index = 0 }) {
  return (
    <div
      className="product-card"
      id={`product-${product.id}`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="product-card__image-wrapper">
        <img
          className="product-card__image"
          src={product.image}
          alt={product.name}
          loading="lazy"
        />
      </div>
      <div className="product-card__body">
        <span className="product-card__category">{product.category}</span>
        <h3 className="product-card__name">{product.name}</h3>
        <p className="product-card__price">{formatPrice(product.price)}</p>
        <div className="product-card__dates">
          <span>Added {formatDate(product.createdAt)}</span>
          <span>Updated {formatDate(product.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}
