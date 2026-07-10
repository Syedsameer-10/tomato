export const resolveCustomerRole = (customer = {}) => {
  return customer.role === "admin" ? "admin" : "customer";
};

export const toPublicCustomer = (customer = {}) => ({
  customer_id: customer.customer_id,
  name: customer.name,
  email: customer.email,
  role: resolveCustomerRole(customer),
});
