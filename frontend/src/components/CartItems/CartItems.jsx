import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CartItems.css";
import { StoreContext } from "../../context/StoreContext";
import { formatINR } from "../../utils/currency";

const CartItems = () => {
  const { all_product, cartItems, addToCart, removeFromCart, getTotalCartAmount, shippingFee } =
    useContext(StoreContext);
  const navigate = useNavigate();
  const cartProducts = all_product.filter((product) => Number(cartItems[product.id]) > 0);
  const subtotal = getTotalCartAmount();

  if (!cartProducts.length) {
    return (
      <section className="cart-empty">
        <p className="section-kicker">YOUR SHOPPING BAG</p>
        <h1>Your bag is taking a breather.</h1>
        <p>Find something you love and it’ll be waiting here.</p>
        <Link to="/">Explore the collection</Link>
      </section>
    );
  }

  const checkout = () => {
    navigate(localStorage.getItem("token") ? "/order" : "/login?redirect=%2Forder");
  };

  return (
    <section className="cartitems">
      <header className="cart-heading">
        <div>
          <p className="section-kicker">YOUR SHOPPING BAG</p>
          <h1>Good choices.</h1>
          <p>{cartProducts.length} item{cartProducts.length === 1 ? "" : "s"} in your bag</p>
        </div>
        <Link to="/">Continue shopping</Link>
      </header>
      <div className="cart-layout">
        <div className="cart-product-list">
          {cartProducts.map((product) => {
            const quantity = Number(cartItems[product.id]);
            return (
              <article className="cart-product" key={product.id}>
                <Link to={`/product/${product.id}`} className="cart-product-image">
                  <img src={product.image} alt={product.name} />
                </Link>
                <div className="cart-product-info">
                  <Link to={`/product/${product.id}`} className="cart-product-name">{product.name}</Link>
                  <span className="cart-product-category">{product.category}</span>
                  <div className="cart-quantity">
                    <button type="button" onClick={() => removeFromCart(product.id)} aria-label={`Remove one ${product.name}`}>−</button>
                    <span>{quantity}</span>
                    <button type="button" onClick={() => addToCart(product.id)} aria-label={`Add one ${product.name}`}>+</button>
                  </div>
                </div>
                <div className="cart-product-total">
                  <strong>{formatINR(product.new_price * quantity)}</strong>
                  <span>{formatINR(product.new_price)} each</span>
                </div>
                <button type="button" className="cart-remove" onClick={() => {
                  for (let count = 0; count < quantity; count += 1) removeFromCart(product.id);
                }}>
                  Remove
                </button>
              </article>
            );
          })}
        </div>
        <aside className="cart-summary">
          <h2>Order summary</h2>
          <div className="cart-summary-line"><span>Subtotal</span><strong>{formatINR(subtotal)}</strong></div>
          <div className="cart-summary-line"><span>Shipping</span><strong>{shippingFee === 0 ? "Free" : formatINR(shippingFee)}</strong></div>
          <div className="cart-summary-line cart-summary-total"><span>Total</span><strong>{formatINR(subtotal + shippingFee)}</strong></div>
          <p className="cart-summary-note">Shipping details are confirmed at checkout.</p>
          <button type="button" onClick={checkout}>Continue to checkout</button>
          <div className="cart-secure-note">Secure checkout · Easy returns</div>
        </aside>
      </div>
    </section>
  );
};

export default CartItems;
