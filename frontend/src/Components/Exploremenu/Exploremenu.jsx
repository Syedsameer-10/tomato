import React from "react";
import "./Exploremenu.css";
import { menu_list } from "../../assets/assets";

const Exploremenu = ({ category, setCategory }) => {
  return (
    <div className="explore-menu" id="explore-menu">
      <h2>Explore Our Menu</h2>
      <div className="menu-list">
        {menu_list.map((menu, index) => (
          <div
            key={index}
            className={`menu-card ${category === menu.menu_name ? "active" : ""}`}
            onClick={() => setCategory(menu.menu_name)}
          >
            <img src={menu.menu_image} alt={menu.menu_name} />
            <span>{menu.menu_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Exploremenu;
