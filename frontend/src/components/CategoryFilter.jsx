import React, { useState, useEffect, useRef } from "react";
import "./CategoryFilter.css";

export default function CategoryFilter({ categories, selected, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (cat) => {
    onChange(cat);
    setIsOpen(false);
  };

  return (
    <div className="category-filter" ref={dropdownRef} id="category-filter">
      <span className="category-filter__label">Category</span>
      <div className="category-filter__custom">
        <button
          type="button"
          className={`category-filter__trigger ${isOpen ? "category-filter__trigger--active" : ""}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{selected}</span>
          <span className={`category-filter__arrow ${isOpen ? "category-filter__arrow--open" : ""}`}>
            ▼
          </span>
        </button>

        {isOpen && (
          <ul className="category-filter__menu">
            {categories.map((cat) => (
              <li
                key={cat}
                className={`category-filter__item ${selected === cat ? "category-filter__item--selected" : ""}`}
                onClick={() => handleSelect(cat)}
              >
                {cat}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
