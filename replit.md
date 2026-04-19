# Tomato - Food Delivery App

A full-stack food delivery web application similar to Zomato/Swiggy, built with React frontend and Node.js/Express backend connected to Supabase (PostgreSQL).

## Tech Stack

- **Frontend**: React 19 + Vite (port 5000)
- **Backend**: Node.js + Express (port 3001)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Plain CSS

## Project Structure

```
backend/
  index.js            # Express API server (port 3001) — all routes use Supabase
  supabaseClient.js   # Reusable Supabase client (uses service role key)
  package.json

frontend/front-end/
  src/
    Components/       # Reusable UI components (Navbar, Footer, FoodItem, LoginPopup, etc.)
    pages/            # Page-level components (Home, Cart, PlaceOrder)
    Context/          # React Context (StoreContext) for global state
    assets/           # Static images and icons
  vite.config.js      # Vite config — proxies /api to backend:3001

start.sh              # Startup script (runs backend + frontend together)
supabase_schema.sql   # Full schema + seed SQL to run in Supabase SQL editor
```

## Workflows

- **Start application**: `bash start.sh` — starts backend (port 3001) and frontend dev server (port 5000)

## Environment Variables / Secrets

- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_ANON_KEY` — Supabase public anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (used server-side)

## Database Schema (Supabase)

Tables defined in `supabase_schema.sql`:
- `restaurants` — Restaurant listings
- `menu_items` — Food items per restaurant
- `customers` — User accounts (bcrypt-hashed passwords)
- `orders` — Customer orders
- `order_details` — Individual items per order
- `order_history` — Denormalized order history
- `activity_log` — User activity log
- `cart` — Persistent cart items
- `menu_nutrition` — Nutritional info per menu item
- `price_audit` — Price change history
- `users` — Extended user profiles

## Initial Supabase Setup

Run `supabase_schema.sql` in the Supabase SQL Editor to create all tables and seed data.

## Key Features

- Restaurant and menu browsing
- Filtering by category (Offers, High Protein, Low Budget, Student Combo)
- Veg/Non-Veg toggle filter
- Keyword search across dishes and restaurants
- Shopping cart (one restaurant at a time)
- User signup/login with bcrypt hashing
- Order placement with delivery address

## API Endpoints

- `GET /api/restaurants` — All restaurants
- `GET /api/menu/:restaurant_id` — Menu for a restaurant
- `GET /api/filter?filter=X&veg=Y` — Filtered menu items
- `GET /api/search?q=query` — Search dishes/restaurants
- `POST /api/placeorder` — Place an order
- `POST /api/signup` — Register user
- `POST /api/login` — Login user
