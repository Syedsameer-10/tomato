// src/assets/assets.js
import logo from './logo.png';
import basket_icon from './basket_icon.png';
import header_img from './header_img.png';
import search_icon from './search_icon.png';
import rating_starts from './rating_starts.png';
import add_icon_green from './add_icon_green.png';
import add_icon_white from './add_icon_white.png';
import remove_icon_red from './remove_icon_red.png';
import cross_icon from './cross_icon.png';
import selector_icon from './selector_icon.png';
import app_store from './app_store.png';
import play_store from './play_store.png';
import linkedin_icon from './linkedin_icon.png';
import facebook_icon from './facebook_icon.png';
import twitter_icon from './twitter_icon.png';
import profile_icon from './profile_icon.png';
import logout_icon from './logout_icon.png';
import bag_icon from './bag_icon.png';
import parcel_icon from './parcel_icon.png';

// Restaurant menu images
import menu_1 from './menu_1.png';
import menu_2 from './menu_2.png';
import menu_3 from './menu_3.png';
import menu_4 from './menu_4.png';
import menu_5 from './menu_5.png';
import menu_6 from './menu_6.png';

import res_1 from './res_1.png';
import res_2 from './res_2.png';
import res_3 from './res_3.png';
import res_4 from './res_4.png';
import res_5 from './res_5.png';
import res_6 from './res_6.png';

// Food images (first 32, continue as needed)
import food_1 from './food_1.png';
import food_2 from './food_2.png';
import food_3 from './food_3.png';
import food_4 from './food_4.png';
import food_5 from './food_5.png';
import food_6 from './food_6.png';
import food_7 from './food_7.png';
import food_8 from './food_8.png';
import food_9 from './food_9.png';
import food_10 from './food_10.png';
import food_11 from './food_11.png';
import food_12 from './food_12.png';
import food_13 from './food_13.png';
import food_14 from './food_14.png';
import food_15 from './food_15.png';
import food_16 from './food_16.png';
import food_17 from './food_17.png';
import food_18 from './food_18.png';
import food_19 from './food_19.png';
import food_20 from './food_20.png';
import food_21 from './food_21.png';
import food_22 from './food_22.png';
import food_23 from './food_23.png';
import food_24 from './food_24.png';
import food_25 from './food_25.png';
import food_26 from './food_26.png';
import food_27 from './food_27.png';
import food_28 from './food_28.png';
import food_29 from './food_29.png';
import food_30 from './food_30.png';
import food_31 from './food_31.png';
import food_32 from './food_32.png';

export const assets = {
  logo,
  basket_icon,
  header_img,
  search_icon,
  rating_starts,
  add_icon_green,
  add_icon_white,
  remove_icon_red,
  cross_icon,
  selector_icon,
  profile_icon,
  logout_icon,
  bag_icon,
  parcel_icon,
  app_store,
  play_store,
  linkedin_icon,
  facebook_icon,
  twitter_icon
};

export const restaurant_assets = {
  "Adyar Anandha Bhavan": res_1,
  "Dominos": res_2,
  "Cool Bis": res_3,
  "Ambur Star Biriyani": res_4,
  "Murugan Idli": res_5,
  "Thalapakatti": res_6,
};

export const menu_list = [
  { menu_name: "Salad", menu_image: menu_1 },
  { menu_name: "Rolls", menu_image: menu_2 },
  { menu_name: "Deserts", menu_image: menu_3 },
  { menu_name: "Sandwich", menu_image: menu_4 },
  { menu_name: "Cake", menu_image: menu_5 },
  { menu_name: "Pure Veg", menu_image: menu_6 },
  { menu_name: "Pasta", menu_image: menu_2 },
  { menu_name: "Noodles", menu_image: menu_3 }
];

export const food_list = [
  // Adyar Anandha Bhavan - 8 dishes
  { id: 1, name: "Idli", image: food_1, price: 30, restaurant: "Adyar Anandha Bhavan" },
  { id: 2, name: "Vada", image: food_2, price: 25, restaurant: "Adyar Anandha Bhavan" },
  { id: 3, name: "Dosa", image: food_3, price: 50, restaurant: "Adyar Anandha Bhavan" },
  { id: 4, name: "Sambar Rice", image: food_4, price: 60, restaurant: "Adyar Anandha Bhavan" },
  { id: 5, name: "Curd Rice", image: food_5, price: 55, restaurant: "Adyar Anandha Bhavan" },
  { id: 6, name: "Rava Kesari", image: food_6, price: 40, restaurant: "Adyar Anandha Bhavan" },
  { id: 7, name: "Mysore Pak", image: food_7, price: 45, restaurant: "Adyar Anandha Bhavan" },
  { id: 8, name: "Medu Vada", image: food_8, price: 35, restaurant: "Adyar Anandha Bhavan" },

  // Dominos - 6 dishes (Indianized South Indian pizzas & sides)
  { id: 9, name: "Paneer Dosa Pizza", image: food_9, price: 200, restaurant: "Dominos" },
  { id: 10, name: "Masala Dosa Pizza", image: food_10, price: 220, restaurant: "Dominos" },
  { id: 11, name: "Cheese Uttapam", image: food_11, price: 180, restaurant: "Dominos" },
  { id: 12, name: "Chicken Dosa Pizza", image: food_12, price: 250, restaurant: "Dominos" },
  { id: 13, name: "Paneer Pakoda", image: food_13, price: 150, restaurant: "Dominos" },
  { id: 14, name: "Veg Spring Roll", image: food_14, price: 120, restaurant: "Dominos" },

  // Cool Bis - 4 dishes (South Indian snacks/juices)
  { id: 15, name: "Mango Juice", image: food_15, price: 50, restaurant: "Cool Bis" },
  { id: 16, name: "Coconut Water", image: food_16, price: 40, restaurant: "Cool Bis" },
  { id: 17, name: "Banana Chips", image: food_17, price: 30, restaurant: "Cool Bis" },
  { id: 18, name: "Filter Coffee", image: food_18, price: 35, restaurant: "Cool Bis" },

  // Ambur Star Biriyani - 4 dishes
  { id: 19, name: "Chicken Biriyani", image: food_19, price: 250, restaurant: "Ambur Star Biriyani" },
  { id: 20, name: "Mutton Biriyani", image: food_20, price: 280, restaurant: "Ambur Star Biriyani" },
  { id: 21, name: "Egg Biriyani", image: food_21, price: 200, restaurant: "Ambur Star Biriyani" },
  { id: 22, name: "Chicken 65", image: food_22, price: 150, restaurant: "Ambur Star Biriyani" },

  // Murugan Idli - 4 dishes
  { id: 23, name: "Idli", image: food_23, price: 25, restaurant: "Murugan Idli" },
  { id: 24, name: "Vada", image: food_24, price: 30, restaurant: "Murugan Idli" },
  { id: 25, name: "Sambar", image: food_25, price: 20, restaurant: "Murugan Idli" },
  { id: 26, name: "Pongal", image: food_26, price: 50, restaurant: "Murugan Idli" },

  // Thalapakatti - 6 dishes
  { id: 27, name: "Chicken Biriyani", image: food_27, price: 250, restaurant: "Thalapakatti" },
  { id: 28, name: "Mutton Biriyani", image: food_28, price: 280, restaurant: "Thalapakatti" },
  { id: 29, name: "Veg Biriyani", image: food_29, price: 200, restaurant: "Thalapakatti" },
  { id: 30, name: "Paneer Biriyani", image: food_30, price: 220, restaurant: "Thalapakatti" },
  { id: 31, name: "Chicken 65", image: food_31, price: 160, restaurant: "Thalapakatti" },
  { id: 32, name: "Gulab Jamun", image: food_32, price: 70, restaurant: "Thalapakatti" }
];
