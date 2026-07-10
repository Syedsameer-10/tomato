import { Router } from "express";

import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { uploadImageToCloudinary } from "../services/cloudinaryService.js";
import supabase from "../supabaseClient.js";
import { isForeignKeyViolation, isMissingOrderCustomerColumnError } from "../utils/databaseErrors.js";
import { menuItemPayloadFromBody, restaurantPayloadFromBody } from "../utils/payloads.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/orders", async (req, res) => {
  try {
    const adminOrderSelect = `
        order_id,
        customer_id,
        order_time,
        status,
        total_amount,
        delivery_address,
        customers (
          name,
          email
        ),
        order_details (
          order_detail_id,
          quantity,
          price,
          menu_items (
            item_id,
            item_name,
            image
          )
        )
      `;

    const legacyAdminOrderSelect = adminOrderSelect.replace("customer_id,", "user_id,");

    let { data: orders, error } = await supabase
      .from("orders")
      .select(adminOrderSelect)
      .order("order_time", { ascending: false });

    if (isMissingOrderCustomerColumnError(error)) {
      ({ data: orders, error } = await supabase
        .from("orders")
        .select(legacyAdminOrderSelect)
        .order("order_time", { ascending: false }));
    }

    if (error) {
      console.error("Admin orders error:", error);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    res.json({ success: true, orders });
  } catch (err) {
    console.error("Admin orders error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.patch("/orders/:order_id/status", async (req, res) => {
  const { order_id } = req.params;
  const { status } = req.body;
  const allowedStatuses = ["Pending", "Preparing", "Out for delivery", "Delivered", "Cancelled"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid order status" });
  }

  try {
    const { data: order, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("order_id", order_id)
      .select("order_id, status")
      .single();

    if (error) {
      console.error("Admin order status error:", error);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    res.json({ success: true, order });
  } catch (err) {
    console.error("Admin order status error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/uploads/image", async (req, res) => {
  const { file, folder } = req.body;

  try {
    const upload = await uploadImageToCloudinary({ file, folder });

    res.status(201).json({
      success: true,
      image: {
        url: upload.secure_url,
        public_id: upload.public_id,
        width: upload.width,
        height: upload.height,
        format: upload.format,
      },
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Unable to upload image",
    });
  }
});

router.get("/restaurants", async (req, res) => {
  try {
    const { data: restaurants, error } = await supabase
      .from("restaurants")
      .select("*")
      .order("restaurant_id", { ascending: true });

    if (error) {
      console.error("Admin restaurants error:", error);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    res.json({ success: true, restaurants });
  } catch (err) {
    console.error("Admin restaurants error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/restaurants", async (req, res) => {
  const payload = restaurantPayloadFromBody(req.body);

  if (!payload.name) {
    return res.status(400).json({ success: false, message: "Restaurant name is required" });
  }

  if (Number.isNaN(payload.rating)) {
    return res.status(400).json({ success: false, message: "Rating must be a number" });
  }

  try {
    const { data: restaurant, error } = await supabase
      .from("restaurants")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      console.error("Admin restaurant create error:", error);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    res.status(201).json({ success: true, restaurant });
  } catch (err) {
    console.error("Admin restaurant create error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.patch("/restaurants/:restaurant_id", async (req, res) => {
  const { restaurant_id } = req.params;
  const payload = restaurantPayloadFromBody(req.body);

  if (!payload.name) {
    return res.status(400).json({ success: false, message: "Restaurant name is required" });
  }

  if (Number.isNaN(payload.rating)) {
    return res.status(400).json({ success: false, message: "Rating must be a number" });
  }

  try {
    const { data: restaurant, error } = await supabase
      .from("restaurants")
      .update(payload)
      .eq("restaurant_id", restaurant_id)
      .select("*")
      .single();

    if (error) {
      console.error("Admin restaurant update error:", error);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    res.json({ success: true, restaurant });
  } catch (err) {
    console.error("Admin restaurant update error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.delete("/restaurants/:restaurant_id", async (req, res) => {
  const { restaurant_id } = req.params;

  try {
    const { error } = await supabase
      .from("restaurants")
      .delete()
      .eq("restaurant_id", restaurant_id);

    if (error) {
      console.error("Admin restaurant delete error:", error);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Admin restaurant delete error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/menu-items", async (req, res) => {
  try {
    const { data: menuItems, error } = await supabase
      .from("menu_items")
      .select("*, restaurants(name)")
      .eq("is_deleted", false)
      .order("item_id", { ascending: true });

    if (error) {
      console.error("Admin menu items error:", error);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    res.json({ success: true, menuItems });
  } catch (err) {
    console.error("Admin menu items error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/menu-items", async (req, res) => {
  const payload = menuItemPayloadFromBody(req.body);

  if (!payload.restaurant_id || !payload.item_name || payload.price === null) {
    return res.status(400).json({ success: false, message: "Restaurant, item name, and price are required" });
  }

  if (Number.isNaN(payload.restaurant_id) || Number.isNaN(payload.price) || Number.isNaN(payload.rating)) {
    return res.status(400).json({ success: false, message: "Restaurant, price, and rating must be numbers" });
  }

  try {
    const { data: menuItem, error } = await supabase
      .from("menu_items")
      .insert(payload)
      .select("*, restaurants(name)")
      .single();

    if (error) {
      console.error("Admin menu item create error:", error);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    res.status(201).json({ success: true, menuItem });
  } catch (err) {
    console.error("Admin menu item create error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.patch("/menu-items/:item_id", async (req, res) => {
  const { item_id } = req.params;
  const payload = menuItemPayloadFromBody(req.body);

  if (!payload.restaurant_id || !payload.item_name || payload.price === null) {
    return res.status(400).json({ success: false, message: "Restaurant, item name, and price are required" });
  }

  if (Number.isNaN(payload.restaurant_id) || Number.isNaN(payload.price) || Number.isNaN(payload.rating)) {
    return res.status(400).json({ success: false, message: "Restaurant, price, and rating must be numbers" });
  }

  try {
    const { data: menuItem, error } = await supabase
      .from("menu_items")
      .update(payload)
      .eq("item_id", item_id)
      .select("*, restaurants(name)")
      .single();

    if (error) {
      console.error("Admin menu item update error:", error);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    res.json({ success: true, menuItem });
  } catch (err) {
    console.error("Admin menu item update error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.delete("/menu-items/:item_id", async (req, res) => {
  const { item_id } = req.params;

  try {
    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("item_id", item_id);

    if (error) {
      if (isForeignKeyViolation(error)) {
        const { data: menuItem, error: archiveError } = await supabase
          .from("menu_items")
          .update({ available: false, is_deleted: true })
          .eq("item_id", item_id)
          .select("item_id")
          .single();

        if (archiveError) {
          console.error("Admin menu item archive error:", archiveError);
          return res.status(500).json({ success: false, message: "Database error" });
        }

        return res.json({ success: true, menuItem, deleted: "soft" });
      }

      console.error("Admin menu item delete error:", error);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Admin menu item delete error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
