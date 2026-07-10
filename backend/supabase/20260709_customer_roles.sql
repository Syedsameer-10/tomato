ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'customer';

ALTER TABLE public.customers
DROP CONSTRAINT IF EXISTS customers_role_check;

ALTER TABLE public.customers
ADD CONSTRAINT customers_role_check CHECK (role IN ('customer', 'admin'));

-- Update this email to your admin account after signup.
-- UPDATE public.customers SET role = 'admin' WHERE email = 'admin@example.com';
