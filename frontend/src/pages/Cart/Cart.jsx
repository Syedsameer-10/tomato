import React, { useContext, useState, useEffect } from 'react';
import './Cart.css';
import { StoreContext } from '../../Context/store-context';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../../lib/api';

const Cart = ({ setShowLogin }) => {
  const {
    cartItems, menuItems, removeFromCart, getTotalCartAmount, user,
    applyCoupon, removeCoupon, appliedCoupon, couponError, getDiscount,
  } = useContext(StoreContext);
  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(30);

  const itemsInCart = menuItems.filter(item => cartItems[item.item_id] > 0);
  const subtotal = getTotalCartAmount();
  const discount = getDiscount();

  // Fetch delivery fee from DB function whenever subtotal changes
  useEffect(() => {
    if (subtotal === 0) { setDeliveryFee(0); return; }
    fetch(apiUrl(`/api/delivery-fee?subtotal=${subtotal}`))
      .then(r => r.json())
      .then(d => { if (d.success) setDeliveryFee(d.delivery_fee); })
      .catch(() => setDeliveryFee(subtotal >= 500 ? 0 : 30));
  }, [subtotal]);

  const total = subtotal + deliveryFee - discount;

  useEffect(() => {
    if (user?.role === "admin") {
      navigate("/admin", { replace: true });
    }
  }, [navigate, user]);

  const handleCheckout = () => {
    if (user?.role === "admin") {
      navigate("/admin", { replace: true });
      return;
    }

    if (!user) {
      alert("❌ Please log in first to place an order!");
      setShowLogin?.(true);
      return;
    }
    navigate('/order');
  };

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    applyCoupon(couponInput);
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
            <p>Subtotal</p><p>₹{subtotal}</p>
          </div>
          <div className='cart-total-details'>
            <p>Delivery Fee</p>
            <p>{deliveryFee === 0 && subtotal > 0 ? <span style={{color:'#2e7d32'}}>FREE 🎉</span> : `₹${deliveryFee}`}</p>
          </div>
          {subtotal >= 500 && subtotal > 0 && (
            <p className='coupon-success'>🎉 Free delivery on orders above ₹500!</p>
          )}
          {discount > 0 && (
            <div className='cart-total-details coupon-discount'>
              <p>Coupon ({appliedCoupon.label})</p>
              <p>− ₹{discount}</p>
            </div>
          )}
          <hr />
          <div className='cart-total-details'>
            <b>Total</b><b>₹{total}</b>
          </div>
          <button type="button" onClick={handleCheckout}>
            PROCEED TO CHECKOUT
          </button>
        </div>

        <div className='cart-promocode'>
          <p>Have a promo code? Enter it here</p>
          <div className='coupon-row'>
            <input
              type="text"
              placeholder="Enter coupon code"
              value={couponInput}
              onChange={e => setCouponInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
              disabled={!!appliedCoupon}
            />
            {appliedCoupon ? (
              <button className='coupon-remove-btn' onClick={() => { removeCoupon(); setCouponInput(""); }}>
                Remove
              </button>
            ) : (
              <button className='coupon-apply-btn' onClick={handleApplyCoupon}>
                Apply
              </button>
            )}
          </div>
          {appliedCoupon && (
            <p className='coupon-success'>✅ Coupon "{appliedCoupon.code}" applied — {appliedCoupon.label}!</p>
          )}
          {couponError && (
            <p className='coupon-error'>❌ {couponError}</p>
          )}
          <p className='coupon-hint'>Try: TOMATO10, FLAT50, WELCOME20</p>
        </div>
      </div>
    </div>
  );
};

export default Cart;
