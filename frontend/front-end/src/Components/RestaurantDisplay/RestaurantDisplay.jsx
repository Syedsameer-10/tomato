import React, { useEffect, useState, useContext } from "react";
import "./RestaurantDisplay.css";
import Fooditem from "../Fooditem/Fooditem";

import { StoreContext } from "../../Context/storecontext";

const RestaurantDisplay = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [menuData, setMenuData] = useState({});
  const { setMenuItems } = useContext(StoreContext);

  useEffect(() => {
    fetch("http://localhost:5000/api/restaurants")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setRestaurants(data.restaurants);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    let allItems = [];
    restaurants.forEach((rest) => {
      fetch(`http://localhost:5000/api/menu/${rest.restaurant_id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setMenuData((prev) => ({
              ...prev,
              [rest.restaurant_id]: data.menu,
            }));
            allItems = [...allItems, ...data.menu];
            setMenuItems(allItems); // update StoreContext
          }
        })
        .catch((err) => console.error(err));
    });
  }, [restaurants, setMenuItems]);

  return (
    <div className="restaurant-grid">
      {restaurants.map((res) => (
        <div className="restaurant-card" key={res.restaurant_id}>
          <div className="restaurant-header">
            <img src={res.image} alt={res.name} className="restaurant-img" />
            <h2 className="restaurant-name">{res.name}</h2>
          </div>

          <div className="restaurant-food-grid">
            {menuData[res.restaurant_id]?.map((food) => (
              <Fooditem
                key={food.item_id}
                id={food.item_id}
                name={food.item_name}
                price={food.price}
                description={food.description}
                image={food.image}
                restaurantId={res.restaurant_id}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RestaurantDisplay;
