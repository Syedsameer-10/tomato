import express from "express";
import cors from "cors";
import pkg from "pg";
import bcrypt from "bcrypt";

const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

// ✅ PostgreSQL Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch((err) => console.error("❌ DB connection error:", err));

// ============================================================
// 🧩 RESTAURANTS
// ============================================================

app.get("/api/restaurants", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM restaurants ORDER BY restaurant_id ASC");
    res.json({ success: true, restaurants: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// ============================================================
// 🧩 MENU ITEMS
// ============================================================

app.get("/api/menu/:restaurant_id", async (req, res) => {
  const { restaurant_id } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM menu_items WHERE restaurant_id = $1 ORDER BY item_id ASC",
      [restaurant_id]
    );
    res.json({ success: true, menu: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// ============================================================
// 🧩 FILTER API — (Filters + Veg/Non-Veg)
// ============================================================

app.get("/api/filter", async (req, res) => {
  const { filter = "All", veg = "Veg" } = req.query; // e.g., ?filter=High Protein&veg=Veg
  console.log(`🎯 Received filter: ${filter}, Veg/Non-Veg: ${veg}`);

  try {
    let query = `
      SELECT m.*, r.name AS restaurant_name, r.location
      FROM menu_items m
      JOIN restaurants r ON m.restaurant_id = r.restaurant_id
      WHERE m.available = true
    `;

    // 🥗 Veg / Non-Veg filter handling
    if (veg) {
      if (veg === "Veg") {
        query += " AND LOWER(m.veg_nonveg) = 'veg'";
      } else if (veg === "Non-Veg") {
        query += " AND LOWER(m.veg_nonveg) = 'nonveg'";
      }
    }

    // 🎛 Apply selected filter
    switch (filter) {
      case "Offers":
        query += " AND m.price <= 200 ORDER BY m.price ASC";
        break;

      case "Rating 4.5+":
        query += " AND m.rating >= 4.5 ORDER BY m.rating DESC";
        break;

      case "High Protein":
        query += `
          AND (
            LOWER(m.item_name) LIKE '%chicken%' OR
            LOWER(m.item_name) LIKE '%egg%' OR
            LOWER(m.item_name) LIKE '%paneer%' OR
            LOWER(m.description) LIKE '%protein%'
          )
          ORDER BY m.rating DESC
        `;
        break;

      case "Low Budget":
        query += " AND m.price <= 100 ORDER BY m.price ASC";
        break;

      case "Student Combo":
        query += `
          AND (
            LOWER(m.item_name) LIKE '%combo%' OR
            LOWER(m.item_name) LIKE '%meal%' OR
            m.price BETWEEN 50 AND 150
          )
          ORDER BY m.price ASC
        `;
        break;

      default:
        query += " ORDER BY m.rating DESC";
        break;
    }

    const result = await pool.query(query);
    console.log(`✅ Returning ${result.rows.length} items for filter: ${filter} (${veg})`);
    res.json({ success: true, items: result.rows });
  } catch (err) {
    console.error("❌ Filter error:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});


// ============================================================
// 🔍 SEARCH API
// ============================================================

// ============================================================
// 🔍 SEARCH API (Fixed — includes restaurant_id for addToCart)
// ============================================================

app.get("/api/search", async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim() === "") {
    return res.status(400).json({ message: "Search query missing" });
  }

  try {
    const searchTerm = `%${q.toLowerCase()}%`;

    const result = await pool.query(
      `
      SELECT 
        m.item_id,
        m.item_name,
        m.price,
        m.description,
        m.image,
        m.veg_nonveg,
        m.rating,
        m.restaurant_id,      -- ✅ Added for cart linking
        r.name AS restaurant_name,
        r.location
      FROM menu_items m
      JOIN restaurants r ON m.restaurant_id = r.restaurant_id
      WHERE LOWER(m.item_name) LIKE $1
         OR LOWER(r.name) LIKE $1
         OR LOWER(m.description) LIKE $1
      ORDER BY r.name;
      `,
      [searchTerm]
    );

    if (result.rows.length === 0) {
      return res.json([]); // ✅ Return empty array (frontend shows “No items found”)
    }

    res.json(result.rows);
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

    const orderResult = await pool.query(
      `INSERT INTO orders (user_id, order_time, status, total_amount, delivery_address)
       VALUES ($1, NOW(), 'Pending', $2, $3) RETURNING order_id`,
      [user_id, total_amount, delivery_address]
    );

    const orderId = orderResult.rows[0].order_id;

    const insertPromises = cartItems.map((item) =>
      pool.query(
        `INSERT INTO order_details (order_id, item_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.item_id, item.quantity, item.price]
      )
    );
    await Promise.all(insertPromises);

    res.json({ success: true, message: "Order placed successfully", orderId });
  } catch (err) {
    console.error("❌ Error placing order:", err);
    res.status(500).json({ success: false, message: "Database error" });
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
    const check = await pool.query("SELECT * FROM customers WHERE email = $1", [email]);
    if (check.rows.length > 0)
      return res.json({ success: false, message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO customers (name, email, password)
       VALUES ($1, $2, $3) RETURNING customer_id, name, email`,
      [name, email, hashedPassword]
    );

    res.json({ success: true, customer: result.rows[0] });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// ✅ LOGIN
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: "All fields required" });

  try {
    const result = await pool.query("SELECT * FROM customers WHERE email = $1", [email]);
    if (result.rows.length === 0)
      return res.status(401).json({ success: false, message: "Invalid email" });

    const user = result.rows[0];
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
app.listen(PORT, "localhost", () => console.log(`🚀 Server running at http://localhost:${PORT}`));
