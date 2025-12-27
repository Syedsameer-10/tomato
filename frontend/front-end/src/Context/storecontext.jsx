import { createContext, useState } from "react";

export const StoreContext = createContext(null);

const StoreContextProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState({});
  const [menuItems, setMenuItems] = useState([]);
  const [activeRestaurant, setActiveRestaurant] = useState(null);
  const [user, setUser] = useState(null); // 🔥 Logged-in user

  // Add to cart, removeFromCart, clearCart, getTotalCartAmount as before

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

  return (
    <StoreContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      clearCart,
      getTotalCartAmount,
      menuItems,
      setMenuItems,
      activeRestaurant,
      user,       // 🔥 Add user
      setUser,    // 🔥 Add setUser
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;
