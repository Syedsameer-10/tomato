import React, { useState, useContext } from "react";
import "./Navbar.css";
import { assets } from "../../assets/assets";
import { Link } from "react-router-dom";
import { StoreContext } from "../../Context/storecontext";

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("home");
  const { getTotalCartAmount, user, setUser } = useContext(StoreContext);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const handleLogout = () => {
    setUser(null);
  };

  // 🔍 Handle Search Input
  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim() === "") {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/search?q=${value}`);
      const data = await response.json();
      setSearchResults(data);
      setShowResults(true);
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  };

  return (
    <div className="navbar">
      <Link to="/">
        <img src={assets.logo} alt="Logo" className="logo" />
      </Link>

      <ul className="navbar-menu">
        <Link
          to="/"
          onClick={() => setMenu("home")}
          className={menu === "home" ? "active" : ""}
        >
          Home
        </Link>
        <a
          href="#explore-menu"
          onClick={() => setMenu("menu")}
          className={menu === "menu" ? "active" : ""}
        >
          Menu
        </a>
        <a
          href="#app-download"
          onClick={() => setMenu("mobile-app")}
          className={menu === "mobile-app" ? "active" : ""}
        >
          Mobile App
        </a>
        <a
          href="#footer"
          onClick={() => setMenu("contact-us")}
          className={menu === "contact-us" ? "active" : ""}
        >
          Contact Us
        </a>
      </ul>

      <div className="navbar-right">
        {/* 🔍 Search Input */}
        <div className="navbar-search">
          <input
            type="text"
            placeholder="Search food, dishes..."
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
          />
          <img src={assets.search_icon} alt="Search" />

          {/* 🔽 Search Results */}
          {showResults && searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((item, index) => (
                <div key={index} className="search-item">
                  <img src={item.image} alt={item.item_name} />
                  <div>
                    <p className="item-name">{item.item_name}</p>
                    <p className="item-restaurant">
                      {item.restaurant_name} — {item.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 🛒 Cart */}
        <Link to="/cart">
          <div className="navbar-cart-icon">
            <img src={assets.basket_icon} alt="Basket" />
            {getTotalCartAmount() !== 0 && <div className="dot"></div>}
          </div>
        </Link>

        {/* 👤 User */}
        {user ? (
          <div className="navbar-user">
            <span>Hi, {user.name}</span>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <button onClick={() => setShowLogin(true)}>Sign In</button>
        )}
      </div>
    </div>
  );
};

export default Navbar;
