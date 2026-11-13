import React, { useCallback, useEffect, useState } from "react";
import "./ListOrder.css";
import parcel_icon from "./../../assets/parcel_icon.png";
import { toast } from "react-toastify";
import { formatINR } from "../../utils/currency";

const ListOrder = () => {
  const backendUrl = process.env.REACT_APP_API_URL || "http://localhost:4000";
  const token = localStorage.getItem("token");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch(`${backendUrl}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (response.ok) setOrders(result);
      else toast.error(result.error || "Unable to load orders.");
    } catch (error) {
      toast.error("Could not reach the server. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }, [backendUrl, token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (event, orderId) => {
    const status = event.target.value;
    try {
      const response = await fetch(`${backendUrl}/api/orders/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, status }),
      });
      const result = await response.json();
      if (response.ok) {
        setOrders((current) => current.map((order) => (
          order._id === orderId ? { ...order, status } : order
        )));
        toast.success("Order status updated.");
      } else {
        toast.error(result.error || "Unable to update order status.");
      }
    } catch (error) {
      toast.error("Could not reach the server. Check that the backend is running.");
    }
  };

  return (
    <section className="order add">
      <header className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">FULFILLMENT</p>
          <h1>Orders</h1>
          <p className="admin-muted">Keep track of deliveries and order progress.</p>
        </div>
      </header>
      <div className="order-list">
        {loading && <p className="product-list-message">Loading orders...</p>}
        {!loading && orders.length === 0 && <p className="product-list-message">No orders to show yet.</p>}
        {orders.map((order) => (
          <article key={order._id} className="order-item">
            <img src={parcel_icon} alt="" />
            <div className="order-item-details">
              <p className="order-item-product">
                {(order.items || []).map((item) => `${item.name} × ${item.quantity}`).join(", ")}
              </p>
              <p className="order-item-name">
                {order.address?.firstName} {order.address?.lastName}
              </p>
              <div className="order-item-address">
                <p>{order.address?.street}, {order.address?.city}</p>
                <p>{order.address?.state}, {order.address?.country} {order.address?.zipcode}</p>
              </div>
              <p className="order-item-phone">{order.address?.phone}</p>
            </div>
            <p>{(order.items || []).length} item{order.items?.length === 1 ? "" : "s"}</p>
            <p className="order-amount">{formatINR(order.amount)}</p>
            <select onChange={(event) => updateStatus(event, order._id)} value={order.status}>
              <option value="Ordered">Ordered</option>
              <option value="Shipped">Shipped</option>
              <option value="Out for delivery">Out for delivery</option>
              <option value="Delivered">Delivered</option>
            </select>
          </article>
        ))}
      </div>
    </section>
  );
};

export default ListOrder;
