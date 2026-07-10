import { Router } from "express";
import bcrypt from "bcrypt";

import { toPublicCustomer } from "../auth/customer.js";
import { createAuthToken } from "../auth/token.js";
import { requireAuth } from "../middleware/requireAuth.js";
import supabase from "../supabaseClient.js";

const router = Router();

router.get("/auth/me", requireAuth, async (req, res) => {
  try {
    const { data: customer, error } = await supabase
      .from("customers")
      .select("*")
      .eq("customer_id", req.user.customer_id)
      .single();

    if (error || !customer) {
      return res.status(401).json({ success: false, message: "Invalid session" });
    }

    res.json({ success: true, customer: toPublicCustomer(customer) });
  } catch (err) {
    console.error("Auth verification error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields required" });
  }

  try {
    const { data: existing } = await supabase
      .from("customers")
      .select("customer_id")
      .eq("email", email)
      .single();

    if (existing) {
      return res.json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
      .from("customers")
      .insert({ name, email, password: hashedPassword })
      .select("*")
      .single();

    if (error) {
      console.error("Signup error:", error);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    const customer = toPublicCustomer(data);
    const token = createAuthToken(customer);

    res.json({ success: true, customer, token });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "All fields required" });
  }

  try {
    const { data: user, error } = await supabase
      .from("customers")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return res.status(401).json({ success: false, message: "Invalid email" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    const customer = toPublicCustomer(user);
    const token = createAuthToken(customer);

    res.json({ success: true, customer, token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
