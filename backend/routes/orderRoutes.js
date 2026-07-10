import { Router } from "express";

import { requireAuth } from "../middleware/requireAuth.js";
import supabase from "../supabaseClient.js";
import { isMissingOrderCustomerColumnError } from "../utils/databaseErrors.js";

const router = Router();

router.post("/placeorder", requireAuth, async (req, res) => {
  if (req.user.role === "admin") {
    return res.status(403).json({ success: false, message: "Admins cannot place customer orders" });
  }

  try {
    const { subtotal, discount = 0, delivery_address, cartItems } = req.body;
    const customer_id = req.user.customer_id;

    if (!delivery_address || !cartItems || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid order data" });
    }

    const { data: feeData, error: feeError } = await supabase.rpc("calculate_delivery_fee", {
      subtotal: subtotal || 0,
    });
    const delivery_fee = feeError ? (subtotal >= 500 ? 0 : 30) : feeData;
    const total_amount = (subtotal || 0) + delivery_fee - (discount || 0);

    let { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id,
        status: "Pending",
        total_amount,
        delivery_address,
        order_time: new Date().toISOString(),
      })
      .select("order_id")
      .single();

    if (isMissingOrderCustomerColumnError(orderError)) {
      ({ data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: customer_id,
          status: "Pending",
          total_amount,
          delivery_address,
          order_time: new Date().toISOString(),
        })
        .select("order_id")
        .single());
    }

    if (orderError) {
      console.error("Order insert error:", orderError);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    const orderDetails = cartItems.map((item) => ({
      order_id: orderData.order_id,
      item_id: item.item_id,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: detailsError } = await supabase.from("order_details").insert(orderDetails);

    if (detailsError) {
      console.error("Order details insert error:", detailsError);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    res.json({
      success: true,
      message: "Order placed successfully",
      orderId: orderData.order_id,
      delivery_fee,
      total_amount,
    });
  } catch (err) {
    console.error("Place order error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/my-orders", requireAuth, async (req, res) => {
  if (req.user.role === "admin") {
    return res.status(403).json({ success: false, message: "Admins should use the admin orders dashboard" });
  }

  try {
    const orderSelect = `
        order_id,
        order_time,
        status,
        total_amount,
        delivery_address,
        order_details (
          order_detail_id,
          quantity,
          price,
          menu_items (
            item_id,
            item_name,
            image,
            restaurants (
              name
            )
          )
        )
      `;

    let { data: orders, error } = await supabase
      .from("orders")
      .select(orderSelect)
      .eq("customer_id", req.user.customer_id)
      .order("order_time", { ascending: false });

    if (isMissingOrderCustomerColumnError(error)) {
      ({ data: orders, error } = await supabase
        .from("orders")
        .select(orderSelect)
        .eq("user_id", req.user.customer_id)
        .order("order_time", { ascending: false }));
    }

    if (error) {
      console.error("My orders error:", error);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    res.json({ success: true, orders });
  } catch (err) {
    console.error("My orders error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
