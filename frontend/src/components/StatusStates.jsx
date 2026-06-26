import "./StatusStates.css";

export function LoadingState() {
  return (
    <div className="status-state" id="loading-state">
      <div className="status-state__grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-card__image skeleton-pulse" />
            <div className="skeleton-card__body">
              <div className="skeleton-line skeleton-line--sm skeleton-pulse" />
              <div className="skeleton-line skeleton-line--lg skeleton-pulse" />
              <div className="skeleton-line skeleton-line--md skeleton-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ category }) {
  return (
    <div className="status-state status-state--centered" id="empty-state">
      <div className="status-state__icon">📦</div>
      <h3 className="status-state__title">No products found</h3>
      <p className="status-state__text">
        {category && category !== "All"
          ? `No products found in the "${category}" category.`
          : "There are no products to display right now."}
      </p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="status-state status-state--centered" id="error-state">
      <div className="status-state__icon">⚠️</div>
      <h3 className="status-state__title">Something went wrong</h3>
      <p className="status-state__text">{message}</p>
      {onRetry && (
        <button className="status-state__retry-btn" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}
