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
