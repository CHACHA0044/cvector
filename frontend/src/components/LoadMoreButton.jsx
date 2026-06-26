import "./LoadMoreButton.css";

export default function LoadMoreButton({ onClick, loading, hasMore }) {
  if (!hasMore) return null;

  return (
    <div className="load-more-wrapper" id="load-more-wrapper">
      <button
        className="load-more-btn"
        id="load-more-btn"
        onClick={onClick}
        disabled={loading}
      >
        {loading ? (
          <span className="load-more-btn__spinner" />
        ) : (
          "Load More"
        )}
      </button>
    </div>
  );
}
