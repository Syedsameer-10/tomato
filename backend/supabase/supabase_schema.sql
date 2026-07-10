-- ============================================================
-- Tomato Food Delivery App — Supabase Schema
-- Run this in your Supabase SQL Editor (Project → SQL Editor)
-- ============================================================

-- RESTAURANTS
CREATE TABLE IF NOT EXISTS public.restaurants (
    restaurant_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    rating NUMERIC(2,1),
    cuisines VARCHAR(200),
    phone VARCHAR(15),
    email VARCHAR(100),
    open_hours VARCHAR(50),
    image TEXT
);

-- MENU ITEMS
CREATE TABLE IF NOT EXISTS public.menu_items (
    item_id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL REFERENCES public.restaurants(restaurant_id) ON DELETE CASCADE,
    item_name VARCHAR(100) NOT NULL,
    price NUMERIC(8,2) NOT NULL,
    category VARCHAR(50),
    rating NUMERIC(2,1),
    description TEXT,
    available BOOLEAN DEFAULT true,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    image TEXT,
    veg_nonveg VARCHAR(20)
);

-- CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
    customer_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin'))
);

-- ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES public.customers(customer_id) ON DELETE CASCADE,
    order_time TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    status VARCHAR(50) DEFAULT 'Pending',
    total_amount NUMERIC(10,2) NOT NULL,
    delivery_address TEXT NOT NULL
);

-- ORDER DETAILS
CREATE TABLE IF NOT EXISTS public.order_details (
    order_detail_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES public.menu_items(item_id),
    quantity INTEGER NOT NULL,
    price NUMERIC(10,2) NOT NULL
);

-- ORDER HISTORY
CREATE TABLE IF NOT EXISTS public.order_history (
    history_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES public.orders(order_id),
    user_id INTEGER REFERENCES public.customers(customer_id),
    items JSONB,
    total_amount NUMERIC(10,2),
    status VARCHAR(50),
    order_time TIMESTAMP WITHOUT TIME ZONE,
    delivery_address TEXT
);

-- ACTIVITY LOG
CREATE TABLE IF NOT EXISTS public.activity_log (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(50) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- PRICE AUDIT
CREATE TABLE IF NOT EXISTS public.price_audit (
    item_id INTEGER,
    old_price NUMERIC,
    new_price NUMERIC,
    changed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- ============================================================
-- SEED DATA — Restaurants
-- ============================================================
INSERT INTO public.restaurants (restaurant_id, name, location, rating, cuisines, phone, email, open_hours, image) VALUES
(1, 'Adyar Anandha Bhavan', 'T. Nagar, Chennai', 4.5, 'South Indian, Veg', '044-1234567', 'aab@example.com', '7AM - 10PM', 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623480/tomato/seed-images/res_1.png'),
(2, 'Dominos', 'Anna Nagar, Chennai', 4.2, 'Pizza, Fast Food', '044-2345678', 'dominos@example.com', '10AM - 11PM', 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623480/tomato/seed-images/res_2.png'),
(3, 'Cool Bis', 'Velachery, Chennai', 4.1, 'Juices, Snacks', '044-3456789', 'coolbis@example.com', '9AM - 9PM', 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623481/tomato/seed-images/res_3.jpg'),
(4, 'Ambur Star Biriyani', 'Nungambakkam, Chennai', 4.4, 'Biriyani, Indian', '044-4567890', 'amburstar@example.com', '11AM - 11PM', 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623482/tomato/seed-images/res_4.png'),
(5, 'Murugan Idli', 'Mylapore, Chennai', 4.3, 'South Indian, Veg', '044-5678901', 'muruganidli@example.com', '6AM - 10PM', 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623484/tomato/seed-images/res_5.png'),
(6, 'Thalapakatti', 'Kodambakkam, Chennai', 4.6, 'Biriyani, South Indian', '044-6789012', 'thalapakatti@example.com', '11AM - 11PM', 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623485/tomato/seed-images/res_6.png')
ON CONFLICT (restaurant_id) DO NOTHING;

-- Reset sequence after manual IDs
SELECT setval('public.restaurants_restaurant_id_seq', 6, true);

-- ============================================================
-- SEED DATA — Menu Items
-- ============================================================
INSERT INTO public.menu_items (item_id, restaurant_id, item_name, price, category, rating, description, available, image, veg_nonveg) VALUES
(1, 2, 'Paneer Pizza', 99.00, 'Pizza', 4.2, 'Fusion dosa base pizza with paneer topping.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623479/tomato/seed-images/food_9.png', 'veg'),
(2, 2, 'Gourmet Pizza', 220.00, 'Pizza', 4.1, 'Spicy dosa-pizza combo with masala filling.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623409/tomato/seed-images/food_10.png', 'veg'),
(3, 2, 'Margherita Pizza', 180.00, 'Snack', 4.3, 'Cheese-topped uttapam with veggies.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623410/tomato/seed-images/food_11.png', 'veg'),
(4, 2, 'Chicken tikka Pizza', 250.00, 'Pizza', 4.4, 'Savory dosa crust pizza with chicken.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623411/tomato/seed-images/food_12.png', 'non-veg'),
(5, 2, 'Garlic Bread', 150.00, 'Snack', 4.0, 'Deep-fried paneer fritters.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623412/tomato/seed-images/food_13.png', 'veg'),
(6, 2, '6inOne Pizza', 120.00, 'Snack', 4.1, 'Crispy rolls stuffed with veggies.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623413/tomato/seed-images/food_14.png', 'veg'),
(7, 1, 'Idli', 30.00, 'Breakfast', 4.6, 'Soft steamed rice cakes served with chutney and sambar.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623408/tomato/seed-images/food_1.png', 'veg'),
(8, 1, 'Vada', 25.00, 'Snack', 4.5, 'Crispy fried urad dal fritter.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623420/tomato/seed-images/food_2.png', 'veg'),
(9, 1, 'Dosa', 50.00, 'Breakfast', 4.7, 'Golden crisp dosa with masala filling.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623454/tomato/seed-images/food_3.png', 'veg'),
(10, 1, 'Sambar Rice', 60.00, 'Main Course', 4.4, 'Tangy lentil rice with vegetables.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623470/tomato/seed-images/food_4.png', 'veg'),
(11, 1, 'Curd Rice', 55.00, 'Main Course', 4.5, 'Creamy curd rice with curry leaves.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623472/tomato/seed-images/food_5.png', 'veg'),
(12, 1, 'Rava Kesari', 40.00, 'Dessert', 4.3, 'Sweet semolina dessert.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623473/tomato/seed-images/food_6.png', 'veg'),
(13, 1, 'Mysore Pak', 45.00, 'Dessert', 4.8, 'Ghee-rich gram flour sweet.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623474/tomato/seed-images/food_7.png', 'veg'),
(14, 1, 'Medu Vada', 35.00, 'Snack', 4.5, 'Soft yet crunchy urad dal vada.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623477/tomato/seed-images/food_8.png', 'veg'),
(15, 3, 'Paneer sandwich', 50.00, 'Drink', 4.4, 'Fresh mango juice made from real fruit.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623414/tomato/seed-images/food_15.png', 'veg'),
(16, 3, 'Mango shake', 40.00, 'Drink', 4.3, 'Chilled natural tender coconut water.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623415/tomato/seed-images/food_16.png', 'veg'),
(17, 3, 'Strawberry Cupcake', 30.00, 'Snack', 4.2, 'Crispy fried banana chips.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623416/tomato/seed-images/food_17.png', 'veg'),
(18, 3, 'Raspberry Cake', 35.00, 'Beverage', 4.8, 'Authentic South Indian filter coffee.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623417/tomato/seed-images/food_18.png', 'veg'),
(19, 4, 'Chicken Biriyani', 250.00, 'Main Course', 4.7, 'Traditional Ambur-style chicken biriyani.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623419/tomato/seed-images/food_19.png', 'non-veg'),
(20, 4, 'Mutton Biriyani', 280.00, 'Main Course', 4.8, 'Richly spiced mutton biriyani.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623427/tomato/seed-images/food_20.png', 'non-veg'),
(21, 4, 'Egg Biriyani', 200.00, 'Main Course', 4.5, 'Classic biriyani topped with boiled eggs.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623430/tomato/seed-images/food_21.png', 'non-veg'),
(22, 4, 'Chicken 65', 150.00, 'Appetizer', 4.4, 'Fried spicy chicken bites.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623432/tomato/seed-images/food_22.png', 'non-veg'),
(23, 5, 'Idli', 25.00, 'Breakfast', 4.5, 'Soft and fluffy idlis.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623434/tomato/seed-images/food_23.png', 'veg'),
(24, 5, 'Vada', 30.00, 'Snack', 4.3, 'Golden and crispy vadas.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623436/tomato/seed-images/food_24.png', 'veg'),
(25, 5, 'Sambar', 20.00, 'Side', 4.6, 'Traditional spicy lentil stew.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623439/tomato/seed-images/food_25.png', 'veg'),
(26, 5, 'Pongal', 50.00, 'Breakfast', 4.5, 'Comforting moong dal pongal.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623441/tomato/seed-images/food_26.png', 'veg'),
(27, 6, 'Chicken Biriyani', 250.00, 'Main Course', 4.8, 'Famous Dindigul-style chicken biriyani.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623444/tomato/seed-images/food_27.png', 'non-veg'),
(28, 6, 'Mutton Biriyani', 280.00, 'Main Course', 4.9, 'Authentic mutton biriyani with signature spices.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623447/tomato/seed-images/food_28.png', 'non-veg'),
(29, 6, 'Veg Biriyani', 200.00, 'Main Course', 4.3, 'Flavorful vegetable biriyani.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623451/tomato/seed-images/food_29.png', 'veg'),
(30, 6, 'Paneer Biriyani', 220.00, 'Main Course', 4.4, 'Creamy paneer biriyani with aromatic rice.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623457/tomato/seed-images/food_30.png', 'veg'),
(31, 6, 'Chicken 65', 160.00, 'Appetizer', 4.5, 'Deep-fried spicy chicken starter.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623460/tomato/seed-images/food_31.png', 'non-veg'),
(32, 6, 'Gulab Jamun', 70.00, 'Dessert', 4.7, 'Soft, syrupy sweet balls.', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623467/tomato/seed-images/food_32.png', 'veg'),
(33, 1, 'Chenna', 250.00, 'Main Course', 4.8, 'side dish bro', true, NULL, 'veg'),
(34, 1, 'srree hari bonda', 250.00, 'Main Course', 4.8, 'side dish bro', true, 'https://res.cloudinary.com/ievxsqq6/image/upload/v1783623486/tomato/seed-images/sreehari.jpg', 'veg')
ON CONFLICT (item_id) DO NOTHING;

-- Reset sequence after manual IDs
SELECT setval('public.menu_items_item_id_seq', 34, true);

-- ============================================================
-- DISABLE Row Level Security on tables used by the app
-- (Since we use the service role key server-side, this is safe)
-- ============================================================
ALTER TABLE public.restaurants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_audit DISABLE ROW LEVEL SECURITY;
