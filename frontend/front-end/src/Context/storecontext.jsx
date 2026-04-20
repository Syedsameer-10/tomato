import { createContext, useState } from "react";

export const StoreContext = createContext(null);

const COUPONS = {
  TOMATO10: { type: "percent", value: 10, label: "10% off" },
  FLAT50:   { type: "flat",    value: 50, label: "₹50 off" },
  WELCOME20: { type: "percent", value: 20, label: "20% off" },
};

const StoreContextProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState({});
  const [menuItems, setMenuItems] = useState([]);
  const [activeRestaurant, setActiveRestaurant] = useState(null);
  const [user, setUser] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");

  const addToCart = (item) => {
    const { item_id, restaurant_id } = item;
    if (activeRestaurant && activeRestaurant !== restaurant_id) {
      alert("❌ You can only order from one restaurant at a time. Clear your cart to switch.");
      return;
    }
    if (!activeRestaurant) setActiveRestaurant(restaurant_id);

    setCartItems((prev) => ({
      ...prev,
      [item_id]: prev[item_id] ? prev[item_id] + 1 : 1,
    }));

    setMenuItems((prev) => {
      if (!prev.find((i) => i.item_id === item_id)) return [...prev, item];
      return prev;
    });
  };

  const removeFromCart = (item_id) => {
    setCartItems((prev) => {
      const updated = { ...prev };
      if (updated[item_id] > 0) updated[item_id] -= 1;
      if (updated[item_id] === 0) delete updated[item_id];
      if (Object.keys(updated).length === 0) setActiveRestaurant(null);
      return updated;
    });
  };

  const clearCart = () => {
    setCartItems({});
    setActiveRestaurant(null);
    setAppliedCoupon(null);
    setCouponError("");
  };

  const getTotalCartAmount = () => {
    let total = 0;
    for (const itemId in cartItems) {
      const qty = cartItems[itemId];
      if (qty > 0) {
        const item = menuItems.find((i) => i.item_id === itemId || i.item_id === Number(itemId));
        if (item) total += item.price * qty;
      }
    }
    return total;
  };

  const getDiscount = () => {
    if (!appliedCoupon) return 0;
    const subtotal = getTotalCartAmount();
    if (appliedCoupon.type === "percent") {
      return Math.round((subtotal * appliedCoupon.value) / 100);
    }
    return Math.min(appliedCoupon.value, subtotal);
  };

  const applyCoupon = (code) => {
    const coupon = COUPONS[code.trim().toUpperCase()];
    if (!coupon) {
      setCouponError("Invalid coupon code.");
      setAppliedCoupon(null);
      return false;
    }
    setAppliedCoupon({ code: code.trim().toUpperCase(), ...coupon });
    setCouponError("");
    return true;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
  };

  return (
    <StoreContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      clearCart,
      getTotalCartAmount,
      getDiscount,
      applyCoupon,
      removeCoupon,
      appliedCoupon,
      couponError,
      menuItems,
      setMenuItems,
      activeRestaurant,
      user,
      setUser,
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;
