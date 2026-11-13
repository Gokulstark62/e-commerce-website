import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import localProducts from "../assets/all_product";

export const StoreContext = createContext(null);

const getSavedCart = () => {
  try {
    return JSON.parse(localStorage.getItem("cartItems") || "{}");
  } catch (error) {
    return {};
  }
};

const StoreContextProvider = ({ children }) => {
  const [all_product, setAll_product] = useState(localProducts);
  const [cartItems, setCartItems] = useState(getSavedCart);
  const [shippingFee, setShippingFee] = useState(0);
  const backendUrl = process.env.REACT_APP_API_URL || "http://localhost:4000";
  const [cartSynced, setCartSynced] = useState(() => !localStorage.getItem("token"));

  useEffect(() => {
    let active = true;
    const fetchProducts = async () => {
      try {
        const [productResponse, configResponse] = await Promise.all([
          fetch(`${backendUrl}/api/products`),
          fetch(`${backendUrl}/api/store/config`),
        ]);
        const [products, storeConfig] = await Promise.all([
          productResponse.json(),
          configResponse.json(),
        ]);
        if (productResponse.ok && active) setAll_product(products);
        if (configResponse.ok && active && Number.isFinite(Number(storeConfig.shippingFee))) {
          setShippingFee(Number(storeConfig.shippingFee));
        }
      } catch (error) {
        // Keep the included sample catalog available when the API is offline.
      }
    };

    fetchProducts();
    return () => {
      active = false;
    };
  }, [backendUrl]);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      if (cartSynced) localStorage.removeItem("cartItems");
      return;
    }
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems, cartSynced]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return undefined;
    let active = true;
    const fetchCart = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/cart/getCart`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        });
        const cart = await response.json();
        if (response.ok && active) {
          const localCart = getSavedCart();
          const mergedCart = { ...cart };
          Object.entries(localCart).forEach(([itemId, quantity]) => {
            mergedCart[itemId] = (Number(mergedCart[itemId]) || 0) + (Number(quantity) || 0);
          });
          if (Object.keys(localCart).length > 0) {
            const syncResponse = await fetch(`${backendUrl}/api/cart/setCart`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ cartData: mergedCart }),
            });
            const syncResult = await syncResponse.json();
            if (!syncResponse.ok) {
              toast.error(syncResult.error || "Unable to sync your local cart.");
              return;
            }
          }
          setCartItems(mergedCart);
          setCartSynced(true);
        }
        else if (active) toast.error(cart.error || "Unable to load your saved cart.");
      } catch (error) {
        if (active) toast.error("Could not load your saved cart. Your local cart is still available.");
      }
    };
    fetchCart();
    return () => {
      active = false;
    };
  }, [backendUrl]);

  const updateRemoteCart = useCallback(async (itemId, endpoint) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await fetch(`${backendUrl}/api/cart/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemId }),
      });
      const result = await response.json();
      if (!response.ok) toast.error(result.error || "Unable to update your saved cart.");
    } catch (error) {
      toast.error("Could not sync your cart. Your changes may not be saved to your account.");
    }
  }, [backendUrl]);

  const addToCart = useCallback((itemId) => {
    setCartItems((current) => ({
      ...current,
      [itemId]: (Number(current[itemId]) || 0) + 1,
    }));
    updateRemoteCart(itemId, "addToCart");
  }, [updateRemoteCart]);

  const removeFromCart = useCallback((itemId) => {
    setCartItems((current) => {
      const next = { ...current };
      const quantity = (Number(next[itemId]) || 0) - 1;
      if (quantity > 0) next[itemId] = quantity;
      else delete next[itemId];
      return next;
    });
    updateRemoteCart(itemId, "removeFromCart");
  }, [updateRemoteCart]);

  const clearCart = useCallback(() => setCartItems({}), []);

  const getTotalCartAmount = useCallback(() =>
    Object.entries(cartItems).reduce((total, [itemId, quantity]) => {
      const product = all_product.find((item) => Number(item.id) === Number(itemId));
      return product && Number(quantity) > 0
        ? total + Number(product.new_price) * Number(quantity)
        : total;
    }, 0), [all_product, cartItems]);

  const getTotalCartItems = useCallback(() =>
    Object.values(cartItems).reduce((total, quantity) => total + Math.max(0, Number(quantity) || 0), 0),
    [cartItems]
  );

  const contextValue = useMemo(
    () => ({
      all_product,
      cartItems,
      shippingFee,
      addToCart,
      removeFromCart,
      clearCart,
      getTotalCartAmount,
      getTotalCartItems,
    }),
    [all_product, cartItems, shippingFee, addToCart, clearCart, getTotalCartAmount, getTotalCartItems, removeFromCart]
  );

  return <StoreContext.Provider value={contextValue}>{children}</StoreContext.Provider>;
};

export default StoreContextProvider;
