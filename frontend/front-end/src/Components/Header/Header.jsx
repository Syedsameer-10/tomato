import React, { useState } from "react";
import "./Header.css";
import Carousel from "../Carousel/Carousel";

const Header = ({ onFilterSelect, onVegToggle }) => {
  const [isVeg, setIsVeg] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  const toggleCategory = () => {
    const newIsVeg = !isVeg;
    setIsVeg(newIsVeg);
    onVegToggle(newIsVeg ? "Veg" : "Non-Veg"); // send change to parent
  };

  const filters = [
    "Filters",
    "Offers",
    "Rating 4.5+",
    "High Protein",
    "Low Budget",
    "Student Combo",
  ];

  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
    onFilterSelect(filter);
  };

  return (
    <div className="header">
      <div className="header-carousel">
        <Carousel />
      </div>

      <div className="header-overlay">
        <div className="header-top">
          <div className="filter-bar">
            {filters.map((filter) => (
              <button
                key={filter}
                className={`filter-btn ${activeFilter === filter ? "active" : ""}`}
                onClick={() => handleFilterClick(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="category-toggle">
            <span className={!isVeg ? "inactive" : "active"}>Veg</span>
            <label className="switch">
              <input type="checkbox" checked={!isVeg} onChange={toggleCategory} />
              <span className="slider"></span>
            </label>
            <span className={isVeg ? "inactive" : "active"}>Non-Veg</span>
          </div>
        </div>

        <div className="header-contents">
          <h2>Order your favourite food here</h2>
          <p>Choose from a diverse menu featuring delicious dishes</p>
          <button>View Menu</button>
        </div>
      </div>
    </div>
  );
};

export default Header;
