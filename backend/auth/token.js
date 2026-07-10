import jwt from "jsonwebtoken";

const JWT_EXPIRES_IN = "3d";
const DEV_JWT_SECRET = "tomato-dev-secret-change-me";

const getJwtSecret = () => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing JWT_SECRET environment variable");
  }
  return DEV_JWT_SECRET;
};

export const createAuthToken = (customer) => {
  return jwt.sign(
    {
      customer_id: customer.customer_id,
      email: customer.email,
      name: customer.name,
      role: customer.role || "customer",
    },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export const verifyAuthToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};
