import React, { useContext } from 'react';
import './Cart.css';
import { StoreContext } from '../../Context/storecontext';
import { useNavigate } from 'react-router-dom';

const Cart = ({ setShowLogin }) => {
  const { cartItems, menuItems, removeFromCart, getTotalCartAmount, user } = useContext(StoreContext);
  const navigate = useNavigate();

  const itemsInCart = menuItems.filter(item => cartItems[item.item_id] > 0);
  const total = getTotalCartAmount();
  const deliveryFee = total > 0 ? 30 : 0;

  const handleCheckout = () => {
    if (!user) {
      alert("❌ Please log in first to place an order!");
      setShowLogin(true); // open login popup
      return;
    }
    navigate('/order');
  };

  return (
    <div className='cart'>
      <div className='cart-items'>
        <div className='cart-items-title'>
          <p>Item</p>
          <p>Name</p>
          <p>Price</p>
          <p>Quantity</p>
          <p>Total</p>
          <p>Remove</p>
        </div>
      </div>
      <hr />

      {itemsInCart.map(item => (
        <div key={item.item_id}>
          <div className='cart-items-title cart-items-item'>
            <img src={item.image} alt='' />
            <p>{item.item_name}</p>
            <p>₹{item.price}</p>
            <p>{cartItems[item.item_id]}</p>
            <p>₹{item.price * cartItems[item.item_id]}</p>
            <p onClick={() => removeFromCart(item.item_id)} className='cross'>X</p>
          </div>
          <hr />
        </div>
      ))}

      <div className='cart-bottom'>
        <div className='cart-total'>
          <h2>Cart Totals</h2>
          <div className='cart-total-details'>
            <p>Subtotal</p><p>₹{total}</p>
          </div>
          <div className='cart-total-details'>
            <p>Delivery Fee</p><p>₹{deliveryFee}</p>
          </div>
          <div className='cart-total-details'>
            <b>Total</b><b>₹{total + deliveryFee}</b>
          </div>
          <button type="button" onClick={handleCheckout}>
            PROCEED TO CHECKOUT
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
