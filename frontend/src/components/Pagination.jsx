import React from "react";
import "./Pagination.css";

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  // Generate range of page numbers to show (e.g., [1, "...", 4, 5, 6, "...", 100])
  const getPageNumbers = () => {
    const pages = [];
    const delta = 2; // numbers to show before/after current page

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= page - delta && i <= page + delta)
      ) {
        pages.push(i);
      } else if (
        (i === page - delta - 1 && page - delta - 1 > 1) ||
        (i === page + delta + 1 && page + delta + 1 < totalPages)
      ) {
        pages.push("...");
      }
    }

    // Filter duplicates
    return pages.filter((item, idx) => pages.indexOf(item) === idx);
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="pagination">
      <button
        className="pagination__btn pagination__btn--nav"
        onClick={() => onPageChange(1)}
        disabled={page === 1}
        title="First Page"
      >
        &laquo; First
      </button>
      <button
        className="pagination__btn pagination__btn--nav"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        title="Previous Page"
      >
        &lsaquo; Prev
      </button>

      <div className="pagination__pages">
        {pageNumbers.map((num, index) => {
          if (num === "...") {
            return (
              <span key={`dots-${index}`} className="pagination__dots">
                ...
              </span>
            );
          }
          return (
            <button
              key={num}
              className={`pagination__btn ${
                page === num ? "pagination__btn--active" : ""
              }`}
              onClick={() => onPageChange(num)}
            >
              {num}
            </button>
          );
        })}
      </div>

      <button
        className="pagination__btn pagination__btn--nav"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        title="Next Page"
      >
        Next &rsaquo;
      </button>
      <button
        className="pagination__btn pagination__btn--nav"
        onClick={() => onPageChange(totalPages)}
        disabled={page === totalPages}
        title="Last Page"
      >
        Last &raquo;
      </button>
    </div>
  );
}
