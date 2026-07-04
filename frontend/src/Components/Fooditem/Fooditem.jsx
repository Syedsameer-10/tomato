import React, { useContext } from 'react';
import './Fooditem.css';
import { assets } from '../../assets/assets';
import { StoreContext } from '../../Context/storecontext';

const FoodItem = ({ id, name, price, description, image, restaurantId }) => {
  const { cartItems, addToCart, removeFromCart } = useContext(StoreContext);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      item_id: id,
      restaurant_id: restaurantId,
      price,
      item_name: name,
      image,
      description,
    });
  };

  const handleRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    removeFromCart(id);
  };

  return (
    <div className="food-item">
      <div className="food-item-img-container">
        <img className="food-item-image" src={image} alt={name} />
        {!cartItems[id] ? (
          <button type="button" className="add-button" onClick={handleAdd}>
            <img src={assets.add_icon_white} alt="Add" />
          </button>
        ) : (
          <div className="food-item-counter">
            <button type="button" className="counter-btn" onClick={handleRemove}>
              <img src={assets.remove_icon_red} alt="Remove" />
            </button>
            <p>{cartItems[id]}</p>
            <button type="button" className="counter-btn" onClick={handleAdd}>
              <img src={assets.add_icon_green} alt="Add" />
            </button>
          </div>
        )}
      </div>

      <div className="food-item-info">
        <div className="food-item-name-rating">
          <p>{name}</p>
          <img src={assets.rating_starts} alt="Rating" />
        </div>
        <p className="food-item-desc">{description}</p>
        <p className="food-item-price">₹{price}</p>
      </div>
    </div>
  );
};

export default FoodItem;
