import React, { useState, useEffect, useContext } from "react";
import "./Home.css";
import { StoreContext } from "../../Context/storecontext";
import Header from "../../Components/Header/Header";
import Exploremenu from "../../Components/Exploremenu/Exploremenu";
import RestaurantDisplay from "../../Components/RestaurantDisplay/RestaurantDisplay";
import AppDownload from "../../Components/AppDownload/AppDownload";

const Home = () => {
  const [category, setCategory] = useState("All");
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [vegFilter, setVegFilter] = useState("Veg");
  const [filteredItems, setFilteredItems] = useState([]);
  const { addToCart, removeFromCart, cartItems } = useContext(StoreContext);

  // 🔍 Search functionality
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (searchTerm.trim() === "") {
        setSearchResults([]);
        return;
      }
      try {
        const response = await fetch(
          `http://localhost:5000/api/search?q=${encodeURIComponent(searchTerm)}`
        );
        const data = await response.json();
        setSearchResults(data);
      } catch (error) {
        console.error("❌ Error fetching search results:", error);
      }
    };

    const delayDebounce = setTimeout(fetchSearchResults, 400);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // 🧠 Fetch filtered results (Filters + Veg/Non-Veg)
  useEffect(() => {
    const fetchFilteredItems = async () => {
      if (
        (activeFilter === "All" || activeFilter === "Filters") &&
        vegFilter === "Veg"
      ) {
        setFilteredItems([]);
        return;
      }

      try {
        const url = `http://localhost:5000/api/filter?filter=${encodeURIComponent(
          activeFilter
        )}&veg=${encodeURIComponent(vegFilter)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) setFilteredItems(data.items);
      } catch (err) {
        console.error("Filter fetch error:", err);
      }
    };

    fetchFilteredItems();
  }, [activeFilter, vegFilter]);

  // 🔁 Reusable render card with + / - buttons
  const renderFoodCard = (item) => {
    const itemId = item.item_id || item._id;
    const quantity = cartItems[itemId] || 0;

    return (
      <div key={itemId} className="food-card">
        <img src={item.image} alt={item.item_name} className="food-img" />
        <div className="food-info">
          <h3>{item.item_name}</h3>
          <p className="food-restaurant">
            {item.restaurant_name} • {item.location}
          </p>
          <p className="food-desc">{item.description}</p>
          <div className="food-bottom">
            <span className="food-price">₹{item.price}</span>
            {quantity > 0 ? (
              <div className="quantity-controls">
                <button
                  className="decrement-btn"
                  onClick={() => removeFromCart(itemId)}
                >
                  −
                </button>
                <span className="item-count">{quantity}</span>
                <button className="increment-btn" onClick={() => addToCart(item)}>
                  +
                </button>
              </div>
            ) : (
              <button onClick={() => addToCart(item)}>Add to Cart</button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="home-page">
      <Header onFilterSelect={setActiveFilter} onVegToggle={setVegFilter} />

      {/* 🔍 Search bar */}
      <div className="home-search-container">
        <input
          type="text"
          placeholder="Search for dishes or restaurants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* 🧾 Priority: Search > Filter > Default */}
      {searchTerm.trim() !== "" ? (
        searchResults.length > 0 ? (
          <div className="search-results-grid">
            {searchResults.map((item) => renderFoodCard(item))}
          </div>
        ) : (
          <div className="no-results">
            <p>❌ No items found for “{searchTerm}”</p>
          </div>
        )
      ) : filteredItems.length > 0 ? (
        <div className="filtered-section">
          <h3>
            Showing results for “{activeFilter}” ({vegFilter})
          </h3>
          <div className="filtered-grid">
            {filteredItems.map((item) => renderFoodCard(item))}
          </div>
        </div>
      ) : (
        <>
          <Exploremenu category={category} setCategory={setCategory} />
          <RestaurantDisplay setSelectedRestaurant={setSelectedRestaurant} />
          <AppDownload />
        </>
      )}
    </div>
  );
};

export default Home;
