-- ============================================================
-- Tomato Food Delivery App — Functions & Triggers
-- Run this in your Supabase SQL Editor AFTER running supabase_schema.sql
-- ============================================================

-- ============================================================
-- FUNCTION: log_activity
-- Helper to insert a row into activity_log
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_activity(
    p_user_id integer,
    p_action  text,
    p_details text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO activity_log (user_id, action, details, timestamp)
    VALUES (p_user_id, p_action, p_details, NOW());
END;
$$;

-- ============================================================
-- FUNCTION: calculate_delivery_fee
-- Returns 0 (free) if subtotal >= 500, otherwise 30
-- Called via Supabase RPC: supabase.rpc('calculate_delivery_fee', {subtotal})
-- ============================================================
CREATE OR REPLACE FUNCTION public.calculate_delivery_fee(subtotal numeric)
RETURNS numeric
LANGUAGE plpgsql
AS $$
BEGIN
    IF subtotal >= 500 THEN
        RETURN 0;
    ELSE
        RETURN 30;
    END IF;
END;
$$;

-- ============================================================
-- TRIGGER FUNCTION: fn_log_signup
-- Fires after a new customer is inserted → logs SIGNUP to activity_log
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_log_signup()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM log_activity(NEW.customer_id, 'SIGNUP', 'New account created');
    RETURN NEW;
END;
$$;

-- ============================================================
-- TRIGGER FUNCTION: fn_log_order
-- Fires after a new order is inserted → logs ORDER_PLACED to activity_log
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_log_order()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    order_customer_id integer;
BEGIN
    order_customer_id := COALESCE(
        (to_jsonb(NEW)->>'customer_id')::integer,
        (to_jsonb(NEW)->>'user_id')::integer
    );

    INSERT INTO activity_log (user_id, action, details, timestamp)
    VALUES (order_customer_id, 'ORDER_PLACED', 'Order ID: ' || NEW.order_id, NOW());
    RETURN NEW;
END;
$$;

-- ============================================================
-- TRIGGER FUNCTION: fn_store_order_history
-- Fires after a new order is inserted → snapshots order to order_history
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_store_order_history()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    order_customer_id integer;
BEGIN
    order_customer_id := COALESCE(
        (to_jsonb(NEW)->>'customer_id')::integer,
        (to_jsonb(NEW)->>'user_id')::integer
    );

    INSERT INTO order_history (order_id, user_id, items, total_amount, status, order_time, delivery_address)
    VALUES (
        NEW.order_id,
        order_customer_id,
        (SELECT json_agg(json_build_object(
            'item_id',  od.item_id,
            'quantity', od.quantity,
            'price',    od.price
        )) FROM order_details od WHERE od.order_id = NEW.order_id),
        NEW.total_amount,
        NEW.status,
        NEW.order_time,
        NEW.delivery_address
    );
    RETURN NEW;
END;
$$;

-- ============================================================
-- TRIGGER FUNCTION: log_price_change
-- Fires after menu_items.price is updated → logs change to price_audit
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_price_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.price <> OLD.price THEN
        INSERT INTO price_audit (item_id, old_price, new_price)
        VALUES (OLD.item_id, OLD.price, NEW.price);
    END IF;
    RETURN NEW;
END;
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Drop triggers first (safe re-run)
DROP TRIGGER IF EXISTS trg_log_signup          ON public.customers;
DROP TRIGGER IF EXISTS trg_log_order           ON public.orders;
DROP TRIGGER IF EXISTS trg_create_order_history ON public.orders;
DROP TRIGGER IF EXISTS trg_price_change        ON public.menu_items;

-- 1. Log signup: fires when a new customer row is inserted
CREATE TRIGGER trg_log_signup
    AFTER INSERT ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.fn_log_signup();

-- 2. Log order: fires when a new order row is inserted
CREATE TRIGGER trg_log_order
    AFTER INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.fn_log_order();

-- 3. Store order history: fires when a new order row is inserted
CREATE TRIGGER trg_create_order_history
    AFTER INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.fn_store_order_history();

-- 4. Audit price changes: fires when menu_items is updated
CREATE TRIGGER trg_price_change
    AFTER UPDATE ON public.menu_items
    FOR EACH ROW EXECUTE FUNCTION public.log_price_change();
