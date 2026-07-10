import React, { useContext, useEffect, useState } from "react";
import "./MyOrders.css";
import { StoreContext } from "../../Context/store-context";
import { apiUrl } from "../../lib/api";
import { createAuthHeaders } from "../../lib/authHeaders";
import { useNavigate } from "react-router-dom";

const formatCurrency = (amount) => `₹${Number(amount || 0).toFixed(0)}`;

const formatDate = (dateValue) => {
  if (!dateValue) return "Recent order";
  return new Date(dateValue).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const MyOrders = () => {
  const { user, authToken } = useContext(StoreContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.role === "admin") {
      navigate("/admin", { replace: true });
      return;
    }

    if (!authToken) {
      setLoading(false);
      return;
    }

    const loadOrders = async () => {
      try {
        const response = await fetch(apiUrl("/api/my-orders"), {
          headers: createAuthHeaders(authToken),
        });
        const data = await response.json();

        if (!data.success) {
          setError(data.message || "Unable to load orders.");
          return;
        }

        setOrders(data.orders || []);
      } catch {
        setError("Unable to load orders right now.");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [authToken, navigate, user]);

  if (!user || !authToken) {
    return (
      <main className="my-orders">
        <div className="my-orders-empty">
          <h2>My Orders</h2>
          <p>Please sign in to view your order history.</p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="my-orders">
        <p className="my-orders-status">Loading your orders...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="my-orders">
        <div className="my-orders-empty">
          <h2>My Orders</h2>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="my-orders">
      <div className="my-orders-header">
        <h2>My Orders</h2>
        <p>{orders.length} {orders.length === 1 ? "order" : "orders"}</p>
      </div>

      {orders.length === 0 ? (
        <div className="my-orders-empty">
          <p>You have not placed any orders yet.</p>
        </div>
      ) : (
        <div className="my-orders-list">
          {orders.map((order) => (
            <article className="order-card" key={order.order_id}>
              <div className="order-card-top">
                <div>
                  <h3>Order #{order.order_id}</h3>
                  <p>{formatDate(order.order_time)}</p>
                </div>
                <span className="order-status">{order.status}</span>
              </div>

              <div className="order-items">
                {(order.order_details || []).map((detail) => {
                  const item = detail.menu_items || {};
                  return (
                    <div className="order-item" key={detail.order_detail_id}>
                      {item.image ? (
                        <img src={item.image} alt={item.item_name || "Food item"} />
                      ) : (
                        <div className="order-item-placeholder" aria-label="Food item image unavailable" />
                      )}
                      <div>
                        <p className="order-item-name">{item.item_name || "Menu item"}</p>
                        <p className="order-item-meta">
                          Qty {detail.quantity} x {formatCurrency(detail.price)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="order-card-bottom">
                <p>{order.delivery_address}</p>
                <strong>{formatCurrency(order.total_amount)}</strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
};

export default MyOrders;
