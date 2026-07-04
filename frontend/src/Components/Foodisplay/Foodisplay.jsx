import React from 'react';
import './Foodisplay.css';
import { food_list } from '../../assets/assets';

const Foodisplay = ({ category, restaurant }) => {
  // Filter food items based on selected category and restaurant
  const filteredFoods = food_list.filter((food) => {
    const matchCategory = category === 'All' || food.category === category;
    const matchRestaurant = !restaurant || food.restaurant === restaurant;
    return matchCategory && matchRestaurant;
  });

  if (filteredFoods.length === 0) {
    return <p className="no-food">No items found for this selection.</p>;
  }

  return (
    <div className="food-display-list">
      {filteredFoods.map((food) => (
        <div key={food._id} className="food-item">
          <div className="food-item-img-container">
            <img src={food.image} alt={food.name} className="food-item-image" />
          </div>
          <div className="food-item-info">
            <div className="food-item-name-rating">
              <p>{food.name}</p>
            </div>
            <p className="food-item-desc">{food.description}</p>
            <p className="food-item-price">₹{food.price}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Foodisplay;
