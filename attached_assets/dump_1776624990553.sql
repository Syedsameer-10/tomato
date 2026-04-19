--
-- PostgreSQL database dump
--

\restrict S2qxG5IHryPfUvGie8zaHOJpLQLeoMA3t0UGE7BObSqev7KyBTEGYkdIPdLZCY4

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: calculate_delivery_fee(numeric); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calculate_delivery_fee(subtotal numeric) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF subtotal >= 500 THEN
    RETURN 0;  -- free delivery threshold
  ELSE
    RETURN 30; -- base fee
  END IF;
END;
$$;


ALTER FUNCTION public.calculate_delivery_fee(subtotal numeric) OWNER TO postgres;

--
-- Name: fn_log_order(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_log_order() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO activity_log (user_id, action, details, timestamp)
    VALUES (NEW.user_id, 'ORDER_PLACED', 'Order ID: ' || NEW.order_id, NOW());
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_log_order() OWNER TO postgres;

--
-- Name: fn_log_signup(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_log_signup() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM log_activity(NEW.customer_id, 'SIGNUP', 'New account created');
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_log_signup() OWNER TO postgres;

--
-- Name: fn_store_order_history(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_store_order_history() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO order_history (order_id, user_id, items, total_amount, status, order_time, delivery_address)
    VALUES (
        NEW.order_id,
        NEW.user_id,
        (SELECT json_agg(json_build_object(
            'item_id', od.item_id,
            'quantity', od.quantity,
            'price', od.price
        )) FROM order_details od WHERE od.order_id = NEW.order_id),
        NEW.total_amount,
        NEW.status,
        NEW.order_time,
        NEW.delivery_address
    );

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_store_order_history() OWNER TO postgres;

--
-- Name: log_activity(integer, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_activity(p_user_id integer, p_action text, p_details text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO activity_log (user_id, action, details, timestamp)
    VALUES (p_user_id, p_action, p_details, NOW());
END;
$$;


ALTER FUNCTION public.log_activity(p_user_id integer, p_action text, p_details text) OWNER TO postgres;

--
-- Name: log_price_change(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_price_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.price <> OLD.price THEN
    INSERT INTO price_audit(item_id, old_price, new_price)
    VALUES (OLD.item_id, OLD.price, NEW.price);
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.log_price_change() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_log (
    log_id integer NOT NULL,
    user_id integer,
    action character varying(50) NOT NULL,
    details text,
    "timestamp" timestamp without time zone DEFAULT now()
);


ALTER TABLE public.activity_log OWNER TO postgres;

--
-- Name: activity_log_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.activity_log_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_log_log_id_seq OWNER TO postgres;

--
-- Name: activity_log_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activity_log_log_id_seq OWNED BY public.activity_log.log_id;


--
-- Name: cart; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart (
    cart_id integer NOT NULL,
    user_id integer NOT NULL,
    item_id integer NOT NULL,
    quantity integer DEFAULT 1,
    CONSTRAINT cart_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.cart OWNER TO postgres;

--
-- Name: cart_cart_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cart_cart_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cart_cart_id_seq OWNER TO postgres;

--
-- Name: cart_cart_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cart_cart_id_seq OWNED BY public.cart.cart_id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    customer_id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(100) NOT NULL
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: customers_customer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customers_customer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customers_customer_id_seq OWNER TO postgres;

--
-- Name: customers_customer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customers_customer_id_seq OWNED BY public.customers.customer_id;


--
-- Name: menu_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.menu_items (
    item_id integer NOT NULL,
    restaurant_id integer NOT NULL,
    item_name character varying(100) NOT NULL,
    price numeric(8,2) NOT NULL,
    category character varying(50),
    rating numeric(2,1),
    description text,
    available boolean DEFAULT true,
    image text,
    veg_nonveg character varying(20)
);


ALTER TABLE public.menu_items OWNER TO postgres;

--
-- Name: menu_items_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.menu_items_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.menu_items_item_id_seq OWNER TO postgres;

--
-- Name: menu_items_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.menu_items_item_id_seq OWNED BY public.menu_items.item_id;


--
-- Name: menu_nutrition; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.menu_nutrition (
    menu_id integer NOT NULL,
    rest_id integer NOT NULL,
    protein double precision,
    calories integer,
    veg_status character varying(10),
    CONSTRAINT menu_nutrition_calories_check CHECK ((calories > 0)),
    CONSTRAINT menu_nutrition_protein_check CHECK ((protein >= (0)::double precision)),
    CONSTRAINT menu_nutrition_veg_status_check CHECK (((veg_status)::text = ANY ((ARRAY['Veg'::character varying, 'Non-Veg'::character varying])::text[])))
);


ALTER TABLE public.menu_nutrition OWNER TO postgres;

--
-- Name: order_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_details (
    order_detail_id integer NOT NULL,
    order_id integer NOT NULL,
    item_id integer NOT NULL,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL
);


ALTER TABLE public.order_details OWNER TO postgres;

--
-- Name: order_details_order_detail_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_details_order_detail_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_details_order_detail_id_seq OWNER TO postgres;

--
-- Name: order_details_order_detail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_details_order_detail_id_seq OWNED BY public.order_details.order_detail_id;


--
-- Name: order_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_history (
    history_id integer NOT NULL,
    order_id integer,
    user_id integer,
    items jsonb,
    total_amount numeric(10,2),
    status character varying(50),
    order_time timestamp without time zone,
    delivery_address text
);


ALTER TABLE public.order_history OWNER TO postgres;

--
-- Name: order_history_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_history_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_history_history_id_seq OWNER TO postgres;

--
-- Name: order_history_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_history_history_id_seq OWNED BY public.order_history.history_id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    order_id integer NOT NULL,
    user_id integer NOT NULL,
    order_time timestamp without time zone DEFAULT now(),
    status character varying(50) DEFAULT 'Pending'::character varying,
    total_amount numeric(10,2) NOT NULL,
    delivery_address text NOT NULL
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: orders_order_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_order_id_seq OWNER TO postgres;

--
-- Name: orders_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_order_id_seq OWNED BY public.orders.order_id;


--
-- Name: price_audit; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.price_audit (
    item_id integer,
    old_price numeric,
    new_price numeric,
    changed_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.price_audit OWNER TO postgres;

--
-- Name: restaurants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.restaurants (
    restaurant_id integer NOT NULL,
    name character varying(100) NOT NULL,
    location character varying(100),
    rating numeric(2,1),
    cuisines character varying(200),
    phone character varying(15),
    email character varying(100),
    open_hours character varying(50),
    image text
);


ALTER TABLE public.restaurants OWNER TO postgres;

--
-- Name: restaurants_restaurant_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.restaurants_restaurant_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.restaurants_restaurant_id_seq OWNER TO postgres;

--
-- Name: restaurants_restaurant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.restaurants_restaurant_id_seq OWNED BY public.restaurants.restaurant_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    name character varying(100) NOT NULL,
    phone character varying(15) NOT NULL,
    email character varying(100),
    address text,
    password character varying(100) NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: activity_log log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_log ALTER COLUMN log_id SET DEFAULT nextval('public.activity_log_log_id_seq'::regclass);


--
-- Name: cart cart_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart ALTER COLUMN cart_id SET DEFAULT nextval('public.cart_cart_id_seq'::regclass);


--
-- Name: customers customer_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers ALTER COLUMN customer_id SET DEFAULT nextval('public.customers_customer_id_seq'::regclass);


--
-- Name: menu_items item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_items ALTER COLUMN item_id SET DEFAULT nextval('public.menu_items_item_id_seq'::regclass);


--
-- Name: order_details order_detail_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_details ALTER COLUMN order_detail_id SET DEFAULT nextval('public.order_details_order_detail_id_seq'::regclass);


--
-- Name: order_history history_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_history ALTER COLUMN history_id SET DEFAULT nextval('public.order_history_history_id_seq'::regclass);


--
-- Name: orders order_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN order_id SET DEFAULT nextval('public.orders_order_id_seq'::regclass);


--
-- Name: restaurants restaurant_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurants ALTER COLUMN restaurant_id SET DEFAULT nextval('public.restaurants_restaurant_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Data for Name: activity_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_log (log_id, user_id, action, details, "timestamp") FROM stdin;
1	2	ORDER_PLACED	Order ID: 2	2025-11-06 22:02:10.087827
2	3	SIGNUP	New account created	2025-11-06 22:13:21.683032
3	3	ORDER_PLACED	Order ID: 3	2025-11-06 22:13:47.344771
4	3	ORDER_PLACED	Order ID: 4	2025-11-06 22:24:15.810914
5	4	SIGNUP	New account created	2025-11-06 23:11:39.729646
6	4	ORDER_PLACED	Order ID: 5	2025-11-06 23:11:51.890224
7	5	SIGNUP	New account created	2025-11-06 23:16:48.973532
8	5	ORDER_PLACED	Order ID: 6	2025-11-06 23:17:19.924606
9	6	SIGNUP	New account created	2025-11-06 23:38:54.228144
10	7	SIGNUP	New account created	2025-12-03 13:26:09.570472
\.


--
-- Data for Name: cart; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cart (cart_id, user_id, item_id, quantity) FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (customer_id, name, email, password) FROM stdin;
1	syed	yasmeensajath@gmail.com	$2b$10$YZTEWpfElWGp3loLD7F4deDuqm53hfGOaRTC5xFz6g/TD/EFXkYhy
2	YASMEEN BEGUM S	yasmeensajath@gmaill.com	$2b$10$l08HCtJqjJ8VhZfXkStdHO3CeIjDqxXrAgD8M7LKp9SMItMx95LSi
3	sam	1df@gmail.com	$2b$10$Wa2rN/IT3rGBgrewmY/vRuRbC6W034AAzopKU7kb3q.GZa8RH2zOG
4	syed	1d1f@gmail.com	$2b$10$oz5KdAF6pAO9FmC4TD7imu7w0dgQWs.xJtX3ajkX6b1FmZdUP0jx2
5	syed	yasmeensajath@gmaail.com	$2b$10$Uq8z3ctLKZYl.gaKlwi7su70sh.ha2fW73qUj0vVp03HU5GHJjqwO
6	syed	yasmeensfgajath@gmail.com	$2b$10$M/Zio7u6p6HIKNXSpJRjV.qrcz4lnti2KszmBN0C/FF25xlEHzqku
7	syed	sameerahamed7616@gmail.com	$2b$10$EVvmNyiBFfVNSwMXbL26FOcjNaoBMJ5BcAhsyjQOefH4xwTeNStw.
\.


--
-- Data for Name: menu_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.menu_items (item_id, restaurant_id, item_name, price, category, rating, description, available, image, veg_nonveg) FROM stdin;
33	1	Chenna	250.00	Main Course	4.8	side dish bro	t	\N	veg
7	1	Idli	30.00	Breakfast	4.6	Soft steamed rice cakes served with chutney and sambar.	t	/images/food_1.png	veg
8	1	Vada	25.00	Snack	4.5	Crispy fried urad dal fritter.	t	/images/food_2.png	veg
9	1	Dosa	50.00	Breakfast	4.7	Golden crisp dosa with masala filling.	t	/images/food_3.png	veg
10	1	Sambar Rice	60.00	Main Course	4.4	Tangy lentil rice with vegetables.	t	/images/food_4.png	veg
11	1	Curd Rice	55.00	Main Course	4.5	Creamy curd rice with curry leaves.	t	/images/food_5.png	veg
12	1	Rava Kesari	40.00	Dessert	4.3	Sweet semolina dessert.	t	/images/food_6.png	veg
13	1	Mysore Pak	45.00	Dessert	4.8	Ghee-rich gram flour sweet.	t	/images/food_7.png	veg
14	1	Medu Vada	35.00	Snack	4.5	Soft yet crunchy urad dal vada.	t	/images/food_8.png	veg
21	4	Egg Biriyani	200.00	Main Course	4.5	Classic biriyani topped with boiled eggs.	t	/images/food_21.png	non-veg
23	5	Idli	25.00	Breakfast	4.5	Soft and fluffy idlis.	t	/images/food_23.png	veg
24	5	Vada	30.00	Snack	4.3	Golden and crispy vadas.	t	/images/food_24.png	veg
25	5	Sambar	20.00	Side	4.6	Traditional spicy lentil stew.	t	/images/food_25.png	veg
26	5	Pongal	50.00	Breakfast	4.5	Comforting moong dal pongal.	t	/images/food_26.png	veg
29	6	Veg Biriyani	200.00	Main Course	4.3	Flavorful vegetable biriyani.	t	/images/food_29.png	veg
30	6	Paneer Biriyani	220.00	Main Course	4.4	Creamy paneer biriyani with aromatic rice.	t	/images/food_30.png	veg
32	6	Gulab Jamun	70.00	Dessert	4.7	Soft, syrupy sweet balls.	t	/images/food_32.png	veg
34	1	srree hari bonda	250.00	Main Course	4.8	side dish bro	t	/images/sreehari.jpg	veg
2	2	Gourmet Pizza	220.00	Pizza	4.1	Spicy dosa-pizza combo with masala filling.	t	/images/food_10.png	veg
3	2	Margherita Pizza	180.00	Snack	4.3	Cheese-topped uttapam with veggies.	t	/images/food_11.png	veg
5	2	Garlic Bread	150.00	Snack	4.0	Deep-fried paneer fritters.	t	/images/food_13.png	veg
6	2	6inOne Pizza	120.00	Snack	4.1	Crispy rolls stuffed with veggies.	t	/images/food_14.png	veg
15	3	Paneer sandwich	50.00	Drink	4.4	Fresh mango juice made from real fruit.	t	/images/food_15.png	veg
16	3	Mango shake	40.00	Drink	4.3	Chilled natural tender coconut water.	t	/images/food_16.png	veg
17	3	Strawberry Cupcake	30.00	Snack	4.2	Crispy fried banana chips.	t	/images/food_17.png	veg
18	3	Raspberry Cake	35.00	Beverage	4.8	Authentic South Indian filter coffee.	t	/images/food_18.png	veg
19	4	Chicken Biriyani	250.00	Main Course	4.7	Traditional Ambur-style chicken biriyani.	t	/images/food_19.png	non-veg
22	4	Chicken 65	150.00	Appetizer	4.4	Fried spicy chicken bites.	t	/images/food_22.png	non-veg
27	6	Chicken Biriyani	250.00	Main Course	4.8	Famous Dindigul-style chicken biriyani.	t	/images/food_27.png	non-veg
31	6	Chicken 65	160.00	Appetizer	4.5	Deep-fried spicy chicken starter.	t	/images/food_31.png	non-veg
4	2	Chicken tikka Pizza	250.00	Pizza	4.4	Savory dosa crust pizza with chicken.	t	/images/food_12.png	non-veg
20	4	Mutton Biriyani	280.00	Main Course	4.8	Richly spiced mutton biriyani.	t	/images/food_20.png	non-veg
28	6	Mutton Biriyani	280.00	Main Course	4.9	Authentic mutton biriyani with signature spices.	t	/images/food_28.png	non-veg
1	2	Paneer Pizza	99.00	Pizza	4.2	Fusion dosa base pizza with paneer topping.	t	/images/food_9.png	veg
\.


--
-- Data for Name: menu_nutrition; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.menu_nutrition (menu_id, rest_id, protein, calories, veg_status) FROM stdin;
33	1	8.5	180	Veg
7	1	6	120	Veg
8	1	5.5	200	Veg
9	1	7	250	Veg
10	1	9	280	Veg
11	1	8	230	Veg
12	1	3	150	Veg
13	1	4	210	Veg
14	1	6	190	Veg
19	4	32	550	Non-Veg
20	4	36	600	Non-Veg
21	4	18	480	Non-Veg
22	4	25	400	Non-Veg
23	5	6	120	Veg
24	5	5.5	180	Veg
25	5	4	100	Veg
26	5	8	250	Veg
27	6	32	560	Non-Veg
28	6	36	610	Non-Veg
29	6	9	320	Veg
30	6	12	350	Veg
31	6	26	420	Non-Veg
32	6	4	260	Veg
34	1	10	300	Veg
1	2	15	400	Veg
2	2	16	420	Veg
3	2	12	350	Veg
4	2	25	480	Non-Veg
5	2	8	300	Veg
6	2	10	310	Veg
15	3	9	250	Veg
16	3	4	180	Veg
17	3	3.5	220	Veg
18	3	5	200	Veg
\.


--
-- Data for Name: order_details; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_details (order_detail_id, order_id, item_id, quantity, price) FROM stdin;
1	1	13	1	45.00
2	2	7	4	30.00
3	3	9	2	50.00
4	4	7	1	30.00
5	4	8	1	25.00
6	5	7	1	30.00
7	6	9	1	50.00
\.


--
-- Data for Name: order_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_history (history_id, order_id, user_id, items, total_amount, status, order_time, delivery_address) FROM stdin;
1	2	2	\N	150.00	Pending	2025-11-06 22:02:10.087827	No 23,14th cross street ,Senthil nagar, Chennai, Tamil Nadu, India - 600099
2	3	3	\N	130.00	Pending	2025-11-06 22:13:47.344771	No 23,14th cross street ,Senthil nagar, Chennai, Tamil Nadu, India - 600099
3	4	3	\N	85.00	Pending	2025-11-06 22:24:15.810914	No 23,14th cross street ,Senthil nagar, Chennai, Tamil Nadu, India - 600099
4	5	4	\N	30.00	Pending	2025-11-06 23:11:51.890224	No 23,14th cross street ,Senthil nagar, Chennai, Tamil Nadu, India - 600099
5	6	5	\N	50.00	Pending	2025-11-06 23:17:19.924606	No 23,14th cross street ,Senthil nagar, Chennai, Tamil Nadu, India - 600099
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (order_id, user_id, order_time, status, total_amount, delivery_address) FROM stdin;
1	1	2025-11-06 21:40:51.680807	Pending	75.00	No 23,14th cross street ,Senthil nagar, Chennai, Tamil Nadu, India - 600099
2	2	2025-11-06 22:02:10.087827	Pending	150.00	No 23,14th cross street ,Senthil nagar, Chennai, Tamil Nadu, India - 600099
3	3	2025-11-06 22:13:47.344771	Pending	130.00	No 23,14th cross street ,Senthil nagar, Chennai, Tamil Nadu, India - 600099
4	3	2025-11-06 22:24:15.810914	Pending	85.00	No 23,14th cross street ,Senthil nagar, Chennai, Tamil Nadu, India - 600099
5	4	2025-11-06 23:11:51.890224	Pending	30.00	No 23,14th cross street ,Senthil nagar, Chennai, Tamil Nadu, India - 600099
6	5	2025-11-06 23:17:19.924606	Pending	50.00	No 23,14th cross street ,Senthil nagar, Chennai, Tamil Nadu, India - 600099
\.


--
-- Data for Name: price_audit; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.price_audit (item_id, old_price, new_price, changed_at) FROM stdin;
1	200.00	99.00	2025-11-06 23:01:47.12735
\.


--
-- Data for Name: restaurants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.restaurants (restaurant_id, name, location, rating, cuisines, phone, email, open_hours, image) FROM stdin;
1	Adyar Anandha Bhavan	T. Nagar, Chennai	4.5	South Indian, Veg	044-1234567	aab@example.com	7AM - 10PM	/images/res_1.png
2	Dominos	Anna Nagar, Chennai	4.2	Pizza, Fast Food	044-2345678	dominos@example.com	10AM - 11PM	/images/res_2.png
3	Cool Bis	Velachery, Chennai	4.1	Juices, Snacks	044-3456789	coolbis@example.com	9AM - 9PM	/images/res_3.png
4	Ambur Star Biriyani	Nungambakkam, Chennai	4.4	Biriyani, Indian	044-4567890	amburstar@example.com	11AM - 11PM	/images/res_4.png
5	Murugan Idli	Mylapore, Chennai	4.3	South Indian, Veg	044-5678901	muruganidli@example.com	6AM - 10PM	/images/res_5.png
6	Thalapakatti	Kodambakkam, Chennai	4.6	Biriyani, South Indian	044-6789012	thalapakatti@example.com	11AM - 11PM	/images/res_6.png
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, name, phone, email, address, password) FROM stdin;
1	Syed Sameer	9876543210	sameer@example.com	Chennai	hashed_password
\.


--
-- Name: activity_log_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activity_log_log_id_seq', 10, true);


--
-- Name: cart_cart_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cart_cart_id_seq', 1, false);


--
-- Name: customers_customer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customers_customer_id_seq', 7, true);


--
-- Name: menu_items_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.menu_items_item_id_seq', 34, true);


--
-- Name: order_details_order_detail_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_details_order_detail_id_seq', 7, true);


--
-- Name: order_history_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_history_history_id_seq', 5, true);


--
-- Name: orders_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_order_id_seq', 6, true);


--
-- Name: restaurants_restaurant_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.restaurants_restaurant_id_seq', 6, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 1, true);


--
-- Name: activity_log activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_pkey PRIMARY KEY (log_id);


--
-- Name: cart cart_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_pkey PRIMARY KEY (cart_id);


--
-- Name: customers customers_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_email_key UNIQUE (email);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (customer_id);


--
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (item_id);


--
-- Name: menu_nutrition menu_nutrition_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_nutrition
    ADD CONSTRAINT menu_nutrition_pkey PRIMARY KEY (menu_id);


--
-- Name: order_details order_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_details
    ADD CONSTRAINT order_details_pkey PRIMARY KEY (order_detail_id);


--
-- Name: order_history order_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_history
    ADD CONSTRAINT order_history_pkey PRIMARY KEY (history_id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (order_id);


--
-- Name: restaurants restaurants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT restaurants_pkey PRIMARY KEY (restaurant_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: orders trg_create_order_history; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_create_order_history AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.fn_store_order_history();


--
-- Name: orders trg_log_order; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_log_order AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.fn_log_order();


--
-- Name: customers trg_log_signup; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_log_signup AFTER INSERT ON public.customers FOR EACH ROW EXECUTE FUNCTION public.fn_log_signup();


--
-- Name: menu_items trg_price_change; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_price_change AFTER UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.log_price_change();


--
-- Name: activity_log activity_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.customers(customer_id);


--
-- Name: cart cart_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.menu_items(item_id) ON DELETE CASCADE;


--
-- Name: cart cart_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: menu_items menu_items_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(restaurant_id) ON DELETE CASCADE;


--
-- Name: menu_nutrition menu_nutrition_menu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_nutrition
    ADD CONSTRAINT menu_nutrition_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES public.menu_items(item_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_details order_details_order_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_details
    ADD CONSTRAINT order_details_order_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON DELETE CASCADE;


--
-- Name: order_history order_history_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_history
    ADD CONSTRAINT order_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id);


--
-- Name: order_history order_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_history
    ADD CONSTRAINT order_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.customers(customer_id);


--
-- Name: orders orders_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fk FOREIGN KEY (user_id) REFERENCES public.customers(customer_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict S2qxG5IHryPfUvGie8zaHOJpLQLeoMA3t0UGE7BObSqev7KyBTEGYkdIPdLZCY4

