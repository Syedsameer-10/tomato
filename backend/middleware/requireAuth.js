import { verifyAuthToken } from "../auth/token.js";
import { toPublicCustomer } from "../auth/customer.js";
import supabase from "../supabaseClient.js";

const getBearerToken = (authorizationHeader = "") => {
  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
};

export const requireAuth = async (req, res, next) => {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  try {
    const tokenUser = verifyAuthToken(token);
    const { data: customer, error } = await supabase
      .from("customers")
      .select("customer_id, name, email, role")
      .eq("customer_id", tokenUser.customer_id)
      .single();

    if (error || !customer) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    req.user = toPublicCustomer(customer);
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
