import { Router } from "express";

import supabase from "../supabaseClient.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({ success: true, service: "tomato-backend" });
});

router.get("/api/health", (req, res) => {
  res.json({ success: true, service: "tomato-backend" });
});

router.get("/api/restaurants", async (req, res) => {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .order("restaurant_id", { ascending: true });

  if (error) {
    console.error("Restaurants error:", error);
    return res.status(500).json({ success: false, message: "Database error" });
  }

  res.json({ success: true, restaurants: data });
});

router.get("/api/menu/:restaurant_id", async (req, res) => {
  const { restaurant_id } = req.params;

  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("restaurant_id", restaurant_id)
    .eq("is_deleted", false)
    .order("item_id", { ascending: true });

  if (error) {
    console.error("Menu error:", error);
    return res.status(500).json({ success: false, message: "Database error" });
  }

  res.json({ success: true, menu: data });
});

router.get("/api/filter", async (req, res) => {
  const { filter = "All", veg = "Veg" } = req.query;

  try {
    let query = supabase
      .from("menu_items")
      .select("*, restaurants(name, location)")
      .eq("available", true)
      .eq("is_deleted", false);

    if (veg === "Veg") {
      query = query.ilike("veg_nonveg", "veg");
    } else if (veg === "Non-Veg") {
      query = query.ilike("veg_nonveg", "non-veg");
    }

    switch (filter) {
      case "Offers":
        query = query.lte("price", 200).order("price", { ascending: true });
        break;
      case "Rating 4.5+":
        query = query.gte("rating", 4.5).order("rating", { ascending: false });
        break;
      case "High Protein":
        query = query
          .or("item_name.ilike.%chicken%,item_name.ilike.%egg%,item_name.ilike.%paneer%,description.ilike.%protein%")
          .order("rating", { ascending: false });
        break;
      case "Low Budget":
        query = query.lte("price", 100).order("price", { ascending: true });
        break;
      case "Student Combo":
        query = query.or("item_name.ilike.%combo%,item_name.ilike.%meal%").order("price", { ascending: true });
        break;
      default:
        query = query.order("rating", { ascending: false });
        break;
    }

    const { data, error } = await query;

    if (error) {
      console.error("Filter error:", error);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    const items = data.map((item) => ({
      ...item,
      restaurant_name: item.restaurants?.name,
      location: item.restaurants?.location,
    }));

    res.json({ success: true, items });
  } catch (err) {
    console.error("Filter error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/api/search", async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim() === "") {
    return res.status(400).json({ message: "Search query missing" });
  }

  try {
    const searchTerm = q.toLowerCase();

    const { data: menuData, error: menuError } = await supabase
      .from("menu_items")
      .select("item_id, item_name, price, description, image, veg_nonveg, rating, restaurant_id, restaurants(name, location)")
      .eq("is_deleted", false)
      .or(`item_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);

    if (menuError) {
      console.error("Search menu error:", menuError);
      return res.status(500).json({ message: "Server error" });
    }

    const { data: restData, error: restError } = await supabase
      .from("menu_items")
      .select("item_id, item_name, price, description, image, veg_nonveg, rating, restaurant_id, restaurants!inner(name, location)")
      .eq("is_deleted", false)
      .ilike("restaurants.name", `%${searchTerm}%`);

    if (restError) {
      console.error("Search restaurant error:", restError);
    }

    const combined = [...(menuData || []), ...(restData || [])];
    const seen = new Set();
    const results = combined
      .filter((item) => {
        if (seen.has(item.item_id)) return false;
        seen.add(item.item_id);
        return true;
      })
      .map((item) => ({
        ...item,
        restaurant_name: item.restaurants?.name,
        location: item.restaurants?.location,
      }));

    res.json(results);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/api/delivery-fee", async (req, res) => {
  try {
    const subtotal = parseFloat(req.query.subtotal) || 0;
    const { data, error } = await supabase.rpc("calculate_delivery_fee", { subtotal });

    if (error) {
      console.error("Delivery fee RPC error:", error);
      return res.json({ success: true, delivery_fee: subtotal >= 500 ? 0 : 30 });
    }

    res.json({ success: true, delivery_fee: data });
  } catch (err) {
    console.error("Delivery fee error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
