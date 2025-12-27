import React, { useContext, useState } from "react";
import "./Placeorder.css";
import { StoreContext } from "../../Context/storecontext";
import { useNavigate } from "react-router-dom";

const Placeorder = () => {
  const { cartItems, menuItems, getTotalCartAmount, clearCart, user } = useContext(StoreContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", street: "",
    city: "", state: "", zip: "", country: "", phone: "",
  });

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
    const total = getTotalCartAmount() + 30;

    const orderData = { 
      user_id: user.customer_id, // 🔥 Logged-in user id
      total_amount: total, 
      delivery_address: deliveryAddress, 
      cartItems: cartItemsArray 
    };

    try {
      const res = await fetch("http://localhost:5000/api/placeorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ Order placed successfully!");
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

  const total = getTotalCartAmount();

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
          <div className="cart-total-details"><p>Subtotal</p><p>₹{total}</p></div>
          <div className="cart-total-details"><p>Delivery Fee</p><p>₹30</p></div>
          <div className="cart-total-details"><b>Total</b><b>₹{total+30}</b></div>
          <button type="submit">PROCEED TO PAYMENT</button>
        </div>
      </div>
    </form>
  );
};

export default Placeorder;
