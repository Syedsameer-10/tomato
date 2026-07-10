import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import "./AdminOrders.css";
import { StoreContext } from "../../Context/store-context";
import { apiUrl, readApiJson } from "../../lib/api";
import { createAuthHeaders } from "../../lib/authHeaders";

const ORDER_STATUSES = ["Pending", "Preparing", "Out for delivery", "Delivered", "Cancelled"];

const EMPTY_RESTAURANT = {
  name: "",
  location: "",
  rating: "",
  cuisines: "",
  phone: "",
  email: "",
  open_hours: "",
  image: "",
};

const EMPTY_MENU_ITEM = {
  restaurant_id: "",
  item_name: "",
  price: "",
  category: "",
  rating: "",
  description: "",
  available: true,
  image: "",
  veg_nonveg: "veg",
};

const formatCurrency = (amount) => `Rs. ${Number(amount || 0).toFixed(0)}`;

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

const normalizeNumber = (value) => (value === "" ? "" : Number(value));

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const AdminDashboard = () => {
  const { user, authToken } = useContext(StoreContext);
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [restaurantForm, setRestaurantForm] = useState(EMPTY_RESTAURANT);
  const [menuForm, setMenuForm] = useState(EMPTY_MENU_ITEM);
  const [editingRestaurantId, setEditingRestaurantId] = useState(null);
  const [editingMenuItemId, setEditingMenuItemId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [message, setMessage] = useState("");

  const isAdmin = user?.role === "admin";

  const stats = useMemo(() => {
    const openOrders = orders.filter((order) => !["Delivered", "Cancelled"].includes(order.status)).length;
    const activeMenuItems = menuItems.filter((item) => item.available).length;

    return {
      orders: orders.length,
      openOrders,
      restaurants: restaurants.length,
      menuItems: activeMenuItems,
    };
  }, [orders, restaurants, menuItems]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const headers = createAuthHeaders(authToken);
      const [ordersResponse, restaurantsResponse, menuResponse] = await Promise.all([
        fetch(apiUrl("/api/admin/orders"), { headers }),
        fetch(apiUrl("/api/admin/restaurants"), { headers }),
        fetch(apiUrl("/api/admin/menu-items"), { headers }),
      ]);

      const [ordersData, restaurantsData, menuData] = await Promise.all([
        readApiJson(ordersResponse),
        readApiJson(restaurantsResponse),
        readApiJson(menuResponse),
      ]);

      if (!ordersData.success || !restaurantsData.success || !menuData.success) {
        setMessage(
          ordersData.message ||
            restaurantsData.message ||
            menuData.message ||
            "Unable to load admin dashboard."
        );
        return;
      }

      setOrders(ordersData.orders || []);
      setRestaurants(restaurantsData.restaurants || []);
      setMenuItems(menuData.menuItems || []);
    } catch {
      setMessage("Unable to load admin dashboard right now.");
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (!authToken || !isAdmin) {
      setLoading(false);
      return;
    }

    loadDashboard();
  }, [authToken, isAdmin, loadDashboard]);

  const jsonHeaders = () => createAuthHeaders(authToken, { "Content-Type": "application/json" });

  const uploadImage = async ({ file, folder }) => {
    const dataUrl = await fileToDataUrl(file);
    const response = await fetch(apiUrl("/api/admin/uploads/image"), {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ file: dataUrl, folder }),
    });
    const data = await readApiJson(response);

    if (!data.success) {
      throw new Error(data.message || "Unable to upload image.");
    }

    return data.image.url;
  };

  const handleRestaurantImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading("restaurant");
    setMessage("");

    try {
      const imageUrl = await uploadImage({ file, folder: "tomato/restaurants" });
      setRestaurantForm((prev) => ({ ...prev, image: imageUrl }));
      setMessage("Restaurant image uploaded.");
    } catch (error) {
      setMessage(error.message || "Unable to upload restaurant image.");
    } finally {
      setUploading("");
      event.target.value = "";
    }
  };

  const handleMenuImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading("menu");
    setMessage("");

    try {
      const imageUrl = await uploadImage({ file, folder: "tomato/menu-items" });
      setMenuForm((prev) => ({ ...prev, image: imageUrl }));
      setMessage("Menu item image uploaded.");
    } catch (error) {
      setMessage(error.message || "Unable to upload menu item image.");
    } finally {
      setUploading("");
      event.target.value = "";
    }
  };

  const handleStatusChange = async (orderId, status) => {
    setMessage("");

    try {
      const response = await fetch(apiUrl(`/api/admin/orders/${orderId}/status`), {
        method: "PATCH",
        headers: jsonHeaders(),
        body: JSON.stringify({ status }),
      });
      const data = await readApiJson(response);

      if (!data.success) {
        setMessage(data.message || "Unable to update order.");
        return;
      }

      setOrders((prev) =>
        prev.map((order) => (order.order_id === orderId ? { ...order, status } : order))
      );
      setMessage(`Order #${orderId} updated to ${status}.`);
    } catch {
      setMessage("Unable to update order right now.");
    }
  };

  const handleRestaurantSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const method = editingRestaurantId ? "PATCH" : "POST";
    const path = editingRestaurantId
      ? `/api/admin/restaurants/${editingRestaurantId}`
      : "/api/admin/restaurants";
    const payload = {
      ...restaurantForm,
      rating: normalizeNumber(restaurantForm.rating),
    };

    try {
      const response = await fetch(apiUrl(path), {
        method,
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await readApiJson(response);

      if (!data.success) {
        setMessage(data.message || "Unable to save restaurant.");
        return;
      }

      setRestaurants((prev) => {
        if (!editingRestaurantId) return [...prev, data.restaurant];
        return prev.map((restaurant) =>
          restaurant.restaurant_id === data.restaurant.restaurant_id ? data.restaurant : restaurant
        );
      });
      setRestaurantForm(EMPTY_RESTAURANT);
      setEditingRestaurantId(null);
      setMessage(editingRestaurantId ? "Restaurant updated." : "Restaurant added.");
    } catch {
      setMessage("Unable to save restaurant right now.");
    } finally {
      setSaving(false);
    }
  };

  const handleMenuSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const method = editingMenuItemId ? "PATCH" : "POST";
    const path = editingMenuItemId
      ? `/api/admin/menu-items/${editingMenuItemId}`
      : "/api/admin/menu-items";
    const payload = {
      ...menuForm,
      restaurant_id: normalizeNumber(menuForm.restaurant_id),
      price: normalizeNumber(menuForm.price),
      rating: normalizeNumber(menuForm.rating),
    };

    try {
      const response = await fetch(apiUrl(path), {
        method,
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await readApiJson(response);

      if (!data.success) {
        setMessage(data.message || "Unable to save menu item.");
        return;
      }

      setMenuItems((prev) => {
        if (!editingMenuItemId) return [...prev, data.menuItem];
        return prev.map((item) => (item.item_id === data.menuItem.item_id ? data.menuItem : item));
      });
      setMenuForm(EMPTY_MENU_ITEM);
      setEditingMenuItemId(null);
      setMessage(editingMenuItemId ? "Menu item updated." : "Menu item added.");
    } catch {
      setMessage("Unable to save menu item right now.");
    } finally {
      setSaving(false);
    }
  };

  const deleteRestaurant = async (restaurantId) => {
    if (!window.confirm("Delete this restaurant and its menu items?")) return;
    setMessage("");

    try {
      const response = await fetch(apiUrl(`/api/admin/restaurants/${restaurantId}`), {
        method: "DELETE",
        headers: createAuthHeaders(authToken),
      });
      const data = await readApiJson(response);

      if (!data.success) {
        setMessage(data.message || "Unable to delete restaurant.");
        return;
      }

      setRestaurants((prev) => prev.filter((restaurant) => restaurant.restaurant_id !== restaurantId));
      setMenuItems((prev) => prev.filter((item) => item.restaurant_id !== restaurantId));
      setMessage("Restaurant deleted.");
    } catch {
      setMessage("Unable to delete restaurant right now.");
    }
  };

  const deleteMenuItem = async (itemId) => {
    if (!window.confirm("Delete this menu item?")) return;
    setMessage("");

    try {
      const response = await fetch(apiUrl(`/api/admin/menu-items/${itemId}`), {
        method: "DELETE",
        headers: createAuthHeaders(authToken),
      });
      const data = await readApiJson(response);

      if (!data.success) {
        setMessage(data.message || "Unable to delete menu item.");
        return;
      }

      setMenuItems((prev) => prev.filter((item) => item.item_id !== itemId));
      setMessage("Menu item deleted.");
    } catch {
      setMessage("Unable to delete menu item right now.");
    }
  };

  const editRestaurant = (restaurant) => {
    setEditingRestaurantId(restaurant.restaurant_id);
    setRestaurantForm({
      name: restaurant.name || "",
      location: restaurant.location || "",
      rating: restaurant.rating ?? "",
      cuisines: restaurant.cuisines || "",
      phone: restaurant.phone || "",
      email: restaurant.email || "",
      open_hours: restaurant.open_hours || "",
      image: restaurant.image || "",
    });
  };

  const editMenuItem = (item) => {
    setEditingMenuItemId(item.item_id);
    setMenuForm({
      restaurant_id: item.restaurant_id || "",
      item_name: item.item_name || "",
      price: item.price ?? "",
      category: item.category || "",
      rating: item.rating ?? "",
      description: item.description || "",
      available: Boolean(item.available),
      image: item.image || "",
      veg_nonveg: item.veg_nonveg || "veg",
    });
  };

  if (!isAdmin) {
    return (
      <main className="admin-dashboard">
        <section className="admin-empty">
          <h2>Admin Dashboard</h2>
          <p>You need admin access to view this page.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-dashboard">
      <div className="admin-header">
        <div>
          <h2>Admin Dashboard</h2>
          <p>Manage orders, restaurants, and menu items.</p>
        </div>
        <button className="admin-secondary-btn" onClick={loadDashboard} disabled={loading}>
          Refresh
        </button>
      </div>

      <section className="admin-stats">
        <div><span>Orders</span><strong>{stats.orders}</strong></div>
        <div><span>Open</span><strong>{stats.openOrders}</strong></div>
        <div><span>Restaurants</span><strong>{stats.restaurants}</strong></div>
        <div><span>Active Items</span><strong>{stats.menuItems}</strong></div>
      </section>

      <div className="admin-tabs">
        <button className={activeTab === "orders" ? "active" : ""} onClick={() => setActiveTab("orders")}>
          Orders
        </button>
        <button className={activeTab === "restaurants" ? "active" : ""} onClick={() => setActiveTab("restaurants")}>
          Restaurants
        </button>
        <button className={activeTab === "menu" ? "active" : ""} onClick={() => setActiveTab("menu")}>
          Menu Items
        </button>
      </div>

      {message && <p className="admin-message">{message}</p>}

      {loading ? (
        <p className="admin-status">Loading dashboard...</p>
      ) : (
        <>
          {activeTab === "orders" && (
            <section className="admin-section">
              {orders.length === 0 ? (
                <div className="admin-empty">
                  <p>No orders found.</p>
                </div>
              ) : (
                <div className="admin-list">
                  {orders.map((order) => (
                    <article className="admin-order-card" key={order.order_id}>
                      <div className="admin-order-main">
                        <div>
                          <h3>Order #{order.order_id}</h3>
                          <p>{formatDate(order.order_time)}</p>
                          <p>{order.customers?.name || "Customer"} - {order.customers?.email || "No email"}</p>
                        </div>
                        <div className="admin-order-actions">
                          <strong>{formatCurrency(order.total_amount)}</strong>
                          <select
                            value={order.status}
                            onChange={(event) => handleStatusChange(order.order_id, event.target.value)}
                          >
                            {ORDER_STATUSES.map((status) => (
                              <option value={status} key={status}>{status}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="admin-order-items">
                        {(order.order_details || []).map((detail) => (
                          <span key={detail.order_detail_id}>
                            {detail.menu_items?.item_name || "Menu item"} x {detail.quantity}
                          </span>
                        ))}
                      </div>

                      <p className="admin-order-address">{order.delivery_address}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === "restaurants" && (
            <section className="admin-grid-section">
              <form className="admin-form" onSubmit={handleRestaurantSubmit}>
                <h3>{editingRestaurantId ? "Edit Restaurant" : "Add Restaurant"}</h3>
                <input required placeholder="Name" value={restaurantForm.name} onChange={(event) => setRestaurantForm({ ...restaurantForm, name: event.target.value })} />
                <input placeholder="Location" value={restaurantForm.location} onChange={(event) => setRestaurantForm({ ...restaurantForm, location: event.target.value })} />
                <input type="number" step="0.1" min="0" max="5" placeholder="Rating" value={restaurantForm.rating} onChange={(event) => setRestaurantForm({ ...restaurantForm, rating: event.target.value })} />
                <input placeholder="Cuisines" value={restaurantForm.cuisines} onChange={(event) => setRestaurantForm({ ...restaurantForm, cuisines: event.target.value })} />
                <input placeholder="Phone" value={restaurantForm.phone} onChange={(event) => setRestaurantForm({ ...restaurantForm, phone: event.target.value })} />
                <input type="email" placeholder="Email" value={restaurantForm.email} onChange={(event) => setRestaurantForm({ ...restaurantForm, email: event.target.value })} />
                <input placeholder="Open hours" value={restaurantForm.open_hours} onChange={(event) => setRestaurantForm({ ...restaurantForm, open_hours: event.target.value })} />
                <label className="admin-upload-field">
                  <span>{uploading === "restaurant" ? "Uploading..." : "Upload image"}</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleRestaurantImageUpload} disabled={uploading === "restaurant"} />
                </label>
                {restaurantForm.image && (
                  <img className="admin-image-preview" src={restaurantForm.image} alt="Restaurant preview" />
                )}
                <div className="admin-form-actions">
                  <button type="submit" disabled={saving}>{editingRestaurantId ? "Save" : "Add"}</button>
                  {editingRestaurantId && (
                    <button type="button" className="admin-secondary-btn" onClick={() => { setEditingRestaurantId(null); setRestaurantForm(EMPTY_RESTAURANT); }}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="admin-table">
                {restaurants.map((restaurant) => (
                  <article className="admin-row" key={restaurant.restaurant_id}>
                    <div>
                      <h3>{restaurant.name}</h3>
                      <p>{restaurant.location || "No location"} - {restaurant.cuisines || "No cuisines"}</p>
                      <p>Rating {restaurant.rating || "N/A"} - {restaurant.open_hours || "Hours not set"}</p>
                    </div>
                    <div className="admin-row-actions">
                      <button onClick={() => editRestaurant(restaurant)}>Edit</button>
                      <button className="admin-danger-btn" onClick={() => deleteRestaurant(restaurant.restaurant_id)}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeTab === "menu" && (
            <section className="admin-grid-section">
              <form className="admin-form" onSubmit={handleMenuSubmit}>
                <h3>{editingMenuItemId ? "Edit Menu Item" : "Add Menu Item"}</h3>
                <select required value={menuForm.restaurant_id} onChange={(event) => setMenuForm({ ...menuForm, restaurant_id: event.target.value })}>
                  <option value="">Select restaurant</option>
                  {restaurants.map((restaurant) => (
                    <option value={restaurant.restaurant_id} key={restaurant.restaurant_id}>{restaurant.name}</option>
                  ))}
                </select>
                <input required placeholder="Item name" value={menuForm.item_name} onChange={(event) => setMenuForm({ ...menuForm, item_name: event.target.value })} />
                <input required type="number" min="0" step="0.01" placeholder="Price" value={menuForm.price} onChange={(event) => setMenuForm({ ...menuForm, price: event.target.value })} />
                <input placeholder="Category" value={menuForm.category} onChange={(event) => setMenuForm({ ...menuForm, category: event.target.value })} />
                <input type="number" step="0.1" min="0" max="5" placeholder="Rating" value={menuForm.rating} onChange={(event) => setMenuForm({ ...menuForm, rating: event.target.value })} />
                <select value={menuForm.veg_nonveg} onChange={(event) => setMenuForm({ ...menuForm, veg_nonveg: event.target.value })}>
                  <option value="veg">Veg</option>
                  <option value="non-veg">Non-Veg</option>
                </select>
                <textarea placeholder="Description" value={menuForm.description} onChange={(event) => setMenuForm({ ...menuForm, description: event.target.value })} />
                <label className="admin-upload-field">
                  <span>{uploading === "menu" ? "Uploading..." : "Upload image"}</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleMenuImageUpload} disabled={uploading === "menu"} />
                </label>
                {menuForm.image && (
                  <img className="admin-image-preview" src={menuForm.image} alt="Menu item preview" />
                )}
                <label className="admin-checkbox">
                  <input type="checkbox" checked={menuForm.available} onChange={(event) => setMenuForm({ ...menuForm, available: event.target.checked })} />
                  Available
                </label>
                <div className="admin-form-actions">
                  <button type="submit" disabled={saving}>{editingMenuItemId ? "Save" : "Add"}</button>
                  {editingMenuItemId && (
                    <button type="button" className="admin-secondary-btn" onClick={() => { setEditingMenuItemId(null); setMenuForm(EMPTY_MENU_ITEM); }}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="admin-table">
                {menuItems.map((item) => (
                  <article className="admin-row admin-menu-row" key={item.item_id}>
                    {item.image ? (
                      <img src={item.image} alt={item.item_name} />
                    ) : (
                      <div className="admin-menu-image-placeholder" aria-label="Menu item image unavailable" />
                    )}
                    <div>
                      <h3>{item.item_name}</h3>
                      <p>{item.restaurants?.name || "Restaurant"} - {item.category || "No category"}</p>
                      <p>{formatCurrency(item.price)} - {item.available ? "Available" : "Hidden"}</p>
                    </div>
                    <div className="admin-row-actions">
                      <button onClick={() => editMenuItem(item)}>Edit</button>
                      <button className="admin-danger-btn" onClick={() => deleteMenuItem(item.item_id)}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
};

export default AdminDashboard;
