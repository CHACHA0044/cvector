import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./AddProductModal.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export default function AddProductModal({ isOpen, onClose, categories, onProductAdded }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[1] || "Electronics");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCategorySelect = (cat) => {
    setCategory(cat);
    setIsDropdownOpen(false);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !category || !price) {
      setError("Please fill in all required fields.");
      return;
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setError("Please enter a valid price greater than 0.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API_BASE}/products`, {
        name,
        category,
        price: numericPrice,
        image: image || undefined,
      });

      onProductAdded(response.data.data);
      setName("");
      setPrice("");
      setImage("");
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to create product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} id="add-product-modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()} id="add-product-modal">
        <header className="modal-header">
          <h2 className="modal-title">Add New Product</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          {error && <div className="modal-error">{error}</div>}

          <div className="modal-field">
            <label className="modal-label" htmlFor="product-name">
              Product Name *
            </label>
            <input
              id="product-name"
              className="modal-input"
              type="text"
              required
              placeholder="e.g. Premium Noise-Cancelling Headphones"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="modal-field" ref={dropdownRef}>
            <label className="modal-label">
              Category *
            </label>
            <div className="modal-custom-dropdown">
              <button
                type="button"
                className={`modal-dropdown-trigger ${isDropdownOpen ? "modal-dropdown-trigger--active" : ""}`}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span>{category}</span>
                <span className={`modal-dropdown-arrow ${isDropdownOpen ? "modal-dropdown-arrow--open" : ""}`}>
                  ▼
                </span>
              </button>

              {isDropdownOpen && (
                <ul className="modal-dropdown-menu">
                  {categories
                    .filter((c) => c !== "All")
                    .map((cat) => (
                      <li
                        key={cat}
                        className={`modal-dropdown-item ${category === cat ? "modal-dropdown-item--selected" : ""}`}
                        onClick={() => handleCategorySelect(cat)}
                      >
                        {cat}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>

          <div className="modal-field">
            <label className="modal-label" htmlFor="product-price">
              Price (USD) *
            </label>
            <input
              id="product-price"
              className="modal-input"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="e.g. 199.99"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div className="modal-field">
            <label className="modal-label" htmlFor="product-image">
              Image URL (Optional)
            </label>
            <input
              id="product-image"
              className="modal-input"
              type="url"
              placeholder="Leave blank to auto-generate a context-matched photo"
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </div>

          <footer className="modal-footer">
            <button
              type="button"
              className="modal-btn modal-btn--secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="modal-btn modal-btn--primary" disabled={loading}>
              {loading ? "Adding..." : "Add Product"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
