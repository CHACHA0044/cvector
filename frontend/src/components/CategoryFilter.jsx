import "./CategoryFilter.css";

export default function CategoryFilter({ categories, selected, onChange }) {
  return (
    <div className="category-filter" id="category-filter">
      <label className="category-filter__label" htmlFor="category-select">
        Category
      </label>
      <select
        id="category-select"
        className="category-filter__select"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
      >
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
    </div>
  );
}
