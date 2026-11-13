import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./CSS/MyOrders.css";
import parcelIcon from "./../assets/parcel_icon.png";
import { formatINR } from "../utils/currency";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const backendUrl = process.env.REACT_APP_API_URL || "http://localhost:4000";
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/orders/userorders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `******`,
        },
      });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error || "Unable to load your orders.");
        return;
      }
      setOrders(result);
    } catch (error) {
      toast.error("Could not reach the server. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    if (!token) {
      navigate("/login?redirect=%2Fmyorders");
      return;
    }
    fetchOrders();
  }, [fetchOrders, navigate, token]);

  return (
    <div className="my-orders">
      <h2>My Orders</h2>
      <div className="container">
        {loading ? <p>Loading your orders...</p> : null}
        {!loading && orders.length === 0 ? <p>You have no completed orders yet.</p> : null}
        {orders.map((order) => (
          <div key={order._id} className="my-orders-order card">
            <img src={parcelIcon} alt="" />
            <p>{order.items.map((item) => `${item.name} x ${item.quantity}`).join(", ")}</p>
            <p>{formatINR(order.amount)}</p>
            <p>Items: {order.items.length}</p>
            <p><span>&#x25cf;</span> <b>{order.status}</b></p>
            <button onClick={fetchOrders} disabled={loading}>Refresh status</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyOrders;
