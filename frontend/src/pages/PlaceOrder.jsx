import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CSS/PlaceOrder.css";
import { StoreContext } from "../context/StoreContext";
import { toast } from "react-toastify";
import { formatINR } from "../utils/currency";

const initialAddress = {
  firstName: "",
  lastName: "",
  email: "",
  street: "",
  city: "",
  state: "",
  zipcode: "",
  country: "",
  phone: "",
};

const PlaceOrder = () => {
  const { getTotalCartAmount, all_product, cartItems, shippingFee } = useContext(StoreContext);
  const token = localStorage.getItem("token");
  const backendUrl = process.env.REACT_APP_API_URL || "http://localhost:4000";
  const [data, setData] = useState(initialAddress);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const subtotal = getTotalCartAmount();

  const changeHandler = (event) => {
    setData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    const items = all_product
      .filter((item) => Number(cartItems[item.id]) > 0)
      .map((item) => ({ ...item, quantity: Number(cartItems[item.id]) }));

    setSubmitting(true);
    try {
      const response = await fetch(`${backendUrl}/api/orders/place`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ address: data, items }),
      });
      const result = await response.json();
      if (response.ok && result.session_url) {
        window.location.replace(result.session_url);
      } else {
        toast.error(result.error || "Unable to start checkout.");
      }
    } catch (error) {
      toast.error("Could not reach the server. Check that the backend is running.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!token) navigate("/login?redirect=%2Forder");
    else if (subtotal === 0) navigate("/cart");
  }, [navigate, subtotal, token]);

  return (
    <form onSubmit={placeOrder} className="place-order">
      <div className="place-order-left card">
        <p className="title">Delivery information</p>
        <div className="multi-fields">
          <input name="firstName" onChange={changeHandler} value={data.firstName} type="text" placeholder="First name" autoComplete="given-name" required />
          <input name="lastName" onChange={changeHandler} value={data.lastName} type="text" placeholder="Last name" autoComplete="family-name" required />
        </div>
        <input name="email" onChange={changeHandler} value={data.email} type="email" placeholder="Email address" autoComplete="email" required />
        <input name="street" onChange={changeHandler} value={data.street} type="text" placeholder="Street address" autoComplete="street-address" required />
        <div className="multi-fields">
          <input name="city" onChange={changeHandler} value={data.city} type="text" placeholder="City" autoComplete="address-level2" required />
          <input name="state" onChange={changeHandler} value={data.state} type="text" placeholder="State" autoComplete="address-level1" required />
        </div>
        <div className="multi-fields">
          <input name="zipcode" onChange={changeHandler} value={data.zipcode} type="text" placeholder="Postal code" autoComplete="postal-code" required />
          <input name="country" onChange={changeHandler} value={data.country} type="text" placeholder="Country" autoComplete="country-name" required />
        </div>
        <input name="phone" onChange={changeHandler} value={data.phone} type="tel" placeholder="Phone" autoComplete="tel" required />
      </div>
      <aside className="place-order-right card">
        <div className="cart-total">
          <h1>Order summary</h1>
          <div className="cart-total-details"><p>Subtotal</p><p>{formatINR(subtotal)}</p></div>
          <hr />
          <div className="cart-total-details"><p>Shipping</p><p>{subtotal === 0 || shippingFee === 0 ? "Free" : formatINR(shippingFee)}</p></div>
          <hr />
          <div className="cart-total-details"><h3>Total</h3><h3>{formatINR(subtotal === 0 ? 0 : subtotal + shippingFee)}</h3></div>
          <button type="submit" disabled={submitting}>
            {submitting ? "Opening secure checkout..." : "Proceed to payment"}
          </button>
        </div>
      </aside>
    </form>
  );
};

export default PlaceOrder;
