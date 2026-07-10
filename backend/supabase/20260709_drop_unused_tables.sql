-- Remove tables that are no longer used by the current app.
-- Cart state now lives in frontend localStorage, auth lives in customers,
-- and menu nutrition is not referenced anywhere in the current product.

DROP TABLE IF EXISTS public.cart;
DROP TABLE IF EXISTS public.menu_nutrition;
DROP TABLE IF EXISTS public.users;
