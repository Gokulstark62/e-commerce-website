import React, { useContext, useEffect, useState } from "react";
import "./CSS/Verify.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import { StoreContext } from "../context/StoreContext";
import { toast } from "react-toastify";

const Verify = () => {
  const [searchParams] = useSearchParams();
  const success = searchParams.get("success");
  const orderId = searchParams.get("orderId");
  const sessionId = searchParams.get("session_id");
  const navigate = useNavigate();
  const { clearCart } = useContext(StoreContext);
  const backendUrl = process.env.REACT_APP_API_URL || "http://localhost:4000";
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    let active = true;
    const verifyPayment = async () => {
      if (success !== "true") {
        try {
          const token = localStorage.getItem("token");
          if (token && orderId) {
            await fetch(`${backendUrl}/api/orders/verify`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ success, orderId }),
            });
          }
        } catch (error) {
          toast.error("We could not confirm whether checkout was canceled. Please check your orders.");
        } finally {
          if (active) navigate("/cart");
        }
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        return;
      }
      try {
        const response = await fetch(`${backendUrl}/api/orders/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ success, orderId, session_id: sessionId }),
        });
        const result = await response.json();
        if (!response.ok) {
          toast.error(result.error || "Unable to confirm your payment.");
          if (active) navigate("/");
          return;
        }
        if (success === "true") clearCart();
        if (active) navigate(success === "true" ? "/myorders" : "/cart");
      } catch (error) {
        toast.error("Could not confirm payment status. Check your orders before trying again.");
        if (active) navigate("/");
      } finally {
        if (active) setVerifying(false);
      }
    };

    verifyPayment();
    return () => {
      active = false;
    };
  }, [backendUrl, clearCart, navigate, orderId, sessionId, success]);

  return (
    <div className="verify">
      {verifying ? <div className="spinner" /> : <p>Redirecting…</p>}
    </div>
  );
};

export default Verify;
