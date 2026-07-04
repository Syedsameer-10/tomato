import React, { useContext, useState, useEffect } from "react";
import "./Placeorder.css";
import { StoreContext } from "../../Context/storecontext";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../../lib/api";

const Placeorder = () => {
  const { cartItems, menuItems, getTotalCartAmount, getDiscount, appliedCoupon, clearCart, user } = useContext(StoreContext);
  const navigate = useNavigate();
  const [deliveryFee, setDeliveryFee] = useState(30);

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", street: "",
    city: "", state: "", zip: "", country: "", phone: "",
  });

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

  const handleChange = e =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handlePlaceOrder = async e => {
    e.preventDefault();

    if (!user) {
      alert("❌ You must log in to place an order!");
      navigate("/login");
      return;
    }

    const cartItemsArray = menuItems
      .filter(item => cartItems[item.item_id] > 0)
      .map(item => ({
        item_id: Number(item.item_id),
        quantity: Number(cartItems[item.item_id]),
        price: Number(item.price),
      }));

    if (cartItemsArray.length === 0) return alert("❌ Your cart is empty!");

    const required = ["firstName","lastName","street","city","state","zip","country","phone"];
    for (let f of required) if (!formData[f].trim()) return alert(`❌ Fill ${f}`);

    const deliveryAddress = `${formData.street}, ${formData.city}, ${formData.state}, ${formData.country} - ${formData.zip}`;

    // Send subtotal + discount; backend calls calculate_delivery_fee DB function
    const orderData = {
      user_id: user.customer_id,
      subtotal,
      discount,
      delivery_address: deliveryAddress,
      cartItems: cartItemsArray,
    };

    try {
      const res = await fetch(apiUrl("/api/placeorder"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ Order placed! Total: ₹${data.total_amount}`);
        clearCart();
        navigate("/");
      } else {
        alert("❌ Failed to place order: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Server error while placing order");
    }
  };

  return (
    <form className="place-order" onSubmit={handlePlaceOrder}>
      <div className="place-order-left">
        <p className="title">Delivery Information</p>
        <div className="multi-fields">
          <input name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} />
          <input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} />
        </div>
        <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} />
        <input name="street" placeholder="Street" value={formData.street} onChange={handleChange} />
        <div className="multi-fields">
          <input name="city" placeholder="City" value={formData.city} onChange={handleChange} />
          <input name="state" placeholder="State" value={formData.state} onChange={handleChange} />
        </div>
        <div className="multi-fields">
          <input name="zip" placeholder="Zip" value={formData.zip} onChange={handleChange} />
          <input name="country" placeholder="Country" value={formData.country} onChange={handleChange} />
        </div>
        <input name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} />
      </div>

      <div className="place-order-right">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div className="cart-total-details"><p>Subtotal</p><p>₹{subtotal}</p></div>
          <div className="cart-total-details">
            <p>Delivery Fee</p>
            <p>{deliveryFee === 0 && subtotal > 0 ? <span style={{color:'#2e7d32'}}>FREE 🎉</span> : `₹${deliveryFee}`}</p>
          </div>
          {discount > 0 && (
            <div className="cart-total-details" style={{color: "#2e7d32"}}>
              <p>Coupon ({appliedCoupon?.label})</p>
              <p>− ₹{discount}</p>
            </div>
          )}
          <hr />
          <div className="cart-total-details"><b>Total</b><b>₹{total}</b></div>
          {subtotal >= 500 && (
            <p style={{fontSize:'12px', color:'#2e7d32', marginTop:'-10px'}}>🎉 Free delivery applied!</p>
          )}
          <button type="submit">PROCEED TO PAYMENT</button>
        </div>
      </div>
    </form>
  );
};

export default Placeorder;
