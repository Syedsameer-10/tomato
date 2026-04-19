import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import supabase from "./supabaseClient.js";

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
// 🧩 RESTAURANTS
// ============================================================

app.get("/api/restaurants", async (req, res) => {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .order("restaurant_id", { ascending: true });

  if (error) {
    console.error("❌ restaurants error:", error);
    return res.status(500).json({ success: false, message: "Database error" });
  }
  res.json({ success: true, restaurants: data });
});

// ============================================================
// 🧩 MENU ITEMS
// ============================================================

app.get("/api/menu/:restaurant_id", async (req, res) => {
  const { restaurant_id } = req.params;

  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("restaurant_id", restaurant_id)
    .order("item_id", { ascending: true });

  if (error) {
    console.error("❌ menu error:", error);
    return res.status(500).json({ success: false, message: "Database error" });
  }
  res.json({ success: true, menu: data });
});

// ============================================================
// 🧩 FILTER API — (Filters + Veg/Non-Veg)
// ============================================================

app.get("/api/filter", async (req, res) => {
  const { filter = "All", veg = "Veg" } = req.query;
  console.log(`🎯 Received filter: ${filter}, Veg/Non-Veg: ${veg}`);

  try {
    let query = supabase
      .from("menu_items")
      .select("*, restaurants(name, location)")
      .eq("available", true);

    // 🥗 Veg / Non-Veg filter
    if (veg === "Veg") {
      query = query.ilike("veg_nonveg", "veg");
    } else if (veg === "Non-Veg") {
      query = query.ilike("veg_nonveg", "non-veg");
    }

    // 🎛 Apply selected filter
    switch (filter) {
      case "Offers":
        query = query.lte("price", 200).order("price", { ascending: true });
        break;

      case "Rating 4.5+":
        query = query.gte("rating", 4.5).order("rating", { ascending: false });
        break;

      case "High Protein":
        query = query
          .or(
            "item_name.ilike.%chicken%,item_name.ilike.%egg%,item_name.ilike.%paneer%,description.ilike.%protein%"
          )
          .order("rating", { ascending: false });
        break;

      case "Low Budget":
        query = query.lte("price", 100).order("price", { ascending: true });
        break;

      case "Student Combo":
        query = query
          .or("item_name.ilike.%combo%,item_name.ilike.%meal%")
          .order("price", { ascending: true });
        break;

      default:
        query = query.order("rating", { ascending: false });
        break;
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Filter error:", error);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    const items = data.map((item) => ({
      ...item,
      restaurant_name: item.restaurants?.name,
      location: item.restaurants?.location,
    }));

    console.log(`✅ Returning ${items.length} items for filter: ${filter} (${veg})`);
    res.json({ success: true, items });
  } catch (err) {
    console.error("❌ Filter error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============================================================
// 🔍 SEARCH API
// ============================================================

app.get("/api/search", async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim() === "") {
    return res.status(400).json({ message: "Search query missing" });
  }

  try {
    const searchTerm = q.toLowerCase();

    const { data: menuData, error: menuError } = await supabase
      .from("menu_items")
      .select("item_id, item_name, price, description, image, veg_nonveg, rating, restaurant_id, restaurants(name, location)")
      .or(
        `item_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
      );

    if (menuError) {
      console.error("❌ Search menu error:", menuError);
      return res.status(500).json({ message: "Server error" });
    }

    const { data: restData, error: restError } = await supabase
      .from("menu_items")
      .select("item_id, item_name, price, description, image, veg_nonveg, rating, restaurant_id, restaurants!inner(name, location)")
      .ilike("restaurants.name", `%${searchTerm}%`);

    if (restError) {
      console.error("❌ Search restaurant error:", restError);
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
    console.error("❌ Error searching items:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================================================
// 🧩 PLACE ORDER
// ============================================================

app.post("/api/placeorder", async (req, res) => {
  try {
    const { user_id, total_amount, delivery_address, cartItems } = req.body;
    console.log("📦 Received Order:", req.body);

    if (!user_id || !delivery_address || !cartItems || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid order data" });
    }

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id,
        status: "Pending",
        total_amount,
        delivery_address,
        order_time: new Date().toISOString(),
      })
      .select("order_id")
      .single();

    if (orderError) {
      console.error("❌ Order insert error:", orderError);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    const orderId = orderData.order_id;

    const orderDetails = cartItems.map((item) => ({
      order_id: orderId,
      item_id: item.item_id,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: detailsError } = await supabase
      .from("order_details")
      .insert(orderDetails);

    if (detailsError) {
      console.error("❌ Order details insert error:", detailsError);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    res.json({ success: true, message: "Order placed successfully", orderId });
  } catch (err) {
    console.error("❌ Error placing order:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============================================================
// 🧩 AUTHENTICATION
// ============================================================

// ✅ SIGN UP
app.post("/api/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ success: false, message: "All fields required" });

  try {
    const { data: existing } = await supabase
      .from("customers")
      .select("customer_id")
      .eq("email", email)
      .single();

    if (existing)
      return res.json({ success: false, message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("customers")
      .insert({ name, email, password: hashedPassword })
      .select("customer_id, name, email")
      .single();

    if (error) {
      console.error("Signup error:", error);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    res.json({ success: true, customer: data });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ LOGIN
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: "All fields required" });

  try {
    const { data: user, error } = await supabase
      .from("customers")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user)
      return res.status(401).json({ success: false, message: "Invalid email" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ success: false, message: "Invalid password" });

    res.json({ success: true, customer: user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============================================================
// START SERVER
// ============================================================

const PORT = process.env.BACKEND_PORT || 3001;
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server running at http://localhost:${PORT}`));
