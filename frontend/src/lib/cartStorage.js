const CART_STORAGE_KEY = "tomato_cart_state";

const defaultCartState = {
  cartItems: {},
  menuItems: [],
  activeRestaurant: null,
  appliedCoupon: null,
};

const canUseStorage = () => typeof window !== "undefined" && window.localStorage;

export const loadCartState = () => {
  if (!canUseStorage()) return defaultCartState;

  try {
    const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!savedCart) return defaultCartState;

    return {
      ...defaultCartState,
      ...JSON.parse(savedCart),
    };
  } catch (error) {
    console.warn("Unable to load saved cart:", error);
    return defaultCartState;
  }
};

export const saveCartState = (cartState) => {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartState));
  } catch (error) {
    console.warn("Unable to save cart:", error);
  }
};

export const clearCartState = () => {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(CART_STORAGE_KEY);
};
