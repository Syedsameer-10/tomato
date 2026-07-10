import { useEffect, useState } from "react";
import { StoreContext } from "./store-context";
import { clearAuthSession, loadAuthSession, saveAuthSession } from "../lib/authStorage";
import { clearCartState, loadCartState, saveCartState } from "../lib/cartStorage";
import { apiUrl } from "../lib/api";

const COUPONS = {
  TOMATO10: { type: "percent", value: 10, label: "10% off" },
  FLAT50:   { type: "flat",    value: 50, label: "₹50 off" },
  WELCOME20: { type: "percent", value: 20, label: "20% off" },
};

const StoreContextProvider = ({ children }) => {
  const [savedCartState] = useState(loadCartState);
  const [savedAuthSession] = useState(loadAuthSession);
  const [cartItems, setCartItems] = useState(savedCartState.cartItems);
  const [menuItems, setMenuItems] = useState(savedCartState.menuItems);
  const [activeRestaurant, setActiveRestaurant] = useState(savedCartState.activeRestaurant);
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(savedAuthSession.token);
  const [appliedCoupon, setAppliedCoupon] = useState(savedCartState.appliedCoupon);
  const [couponError, setCouponError] = useState("");

  useEffect(() => {
    saveCartState({
      cartItems,
      menuItems,
      activeRestaurant,
      appliedCoupon,
    });
  }, [cartItems, menuItems, activeRestaurant, appliedCoupon]);

  const addToCart = (item) => {
    if (user?.role === "admin") {
      alert("Admin accounts cannot place customer orders.");
      return;
    }

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
    clearCartState();
  };

  const loginUser = (customer, token) => {
    if (customer?.role === "admin") {
      clearCart();
    }

    setUser(customer);
    setAuthToken(token);
    saveAuthSession(customer, token);
  };

  const logoutUser = () => {
    setUser(null);
    setAuthToken(null);
    clearAuthSession();
  };

  useEffect(() => {
    if (!authToken) return;

    let isActive = true;

    const verifySavedSession = async () => {
      try {
        const response = await fetch(apiUrl("/api/auth/me"), {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await response.json();

        if (!isActive) return;

        if (data.success) {
          setUser(data.customer);
          saveAuthSession(data.customer, authToken);
          if (data.customer?.role === "admin") clearCart();
        } else {
          logoutUser();
        }
      } catch {
        if (isActive) logoutUser();
      }
    };

    verifySavedSession();

    return () => {
      isActive = false;
    };
  }, [authToken]);

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
      authToken,
      loginUser,
      logoutUser,
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;
