export const isMissingOrderCustomerColumnError = (error) => {
  if (!error) return false;
  const message = `${error.message || ""} ${error.details || ""} ${error.hint || ""}`.toLowerCase();
  return message.includes("orders.customer_id") || message.includes("'customer_id' column");
};

export const isForeignKeyViolation = (error) => {
  if (!error) return false;
  const message = `${error.message || ""} ${error.details || ""} ${error.hint || ""}`.toLowerCase();
  return error.code === "23503" || message.includes("violates foreign key constraint");
};
