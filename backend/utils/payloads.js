const toTrimmedString = (value) => (typeof value === "string" ? value.trim() : value);

const toNullableString = (value) => {
  const trimmed = toTrimmedString(value);
  return trimmed === "" || trimmed === undefined ? null : trimmed;
};

const toNullableNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : NaN;
};

export const restaurantPayloadFromBody = (body) => ({
  name: toTrimmedString(body.name),
  location: toNullableString(body.location),
  rating: toNullableNumber(body.rating),
  cuisines: toNullableString(body.cuisines),
  phone: toNullableString(body.phone),
  email: toNullableString(body.email),
  open_hours: toNullableString(body.open_hours),
  image: toNullableString(body.image),
});

export const menuItemPayloadFromBody = (body) => ({
  restaurant_id: toNullableNumber(body.restaurant_id),
  item_name: toTrimmedString(body.item_name),
  price: toNullableNumber(body.price),
  category: toNullableString(body.category),
  rating: toNullableNumber(body.rating),
  description: toNullableString(body.description),
  available: body.available === undefined ? true : Boolean(body.available),
  image: toNullableString(body.image),
  veg_nonveg: toNullableString(body.veg_nonveg),
});
