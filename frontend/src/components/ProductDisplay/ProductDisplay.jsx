import React, { useContext } from "react";
import "./ProductDisplay.css";
import star_icon from "../../assets/star_icon.png";
import star_dull_icon from "../../assets/star_dull_icon.png";
import { StoreContext } from "../../context/StoreContext";
import { formatINR } from "../../utils/currency";
import { toast } from "react-toastify";

const ProductDisplay = ({ product }) => {
  const { addToCart } = useContext(StoreContext);

  const handleAddToCart = () => {
    addToCart(product.id);
    toast.success(`${product.name} added to your bag.`);
  };

  return (
    <section className="productdisplay">
      <div className="productdisplay-image">
        <img src={product.image} alt={product.name} />
      </div>
      <div className="productdisplay-right">
        <p className="productdisplay-eyebrow">{product.category} · SS Stylo edit</p>
        <h1>{product.name}</h1>
        <div className="productdisplay-right-stars" aria-label="Rated 4 out of 5">
          {[0, 1, 2, 3].map((star) => <img key={star} src={star_icon} alt="" />)}
          <img src={star_dull_icon} alt="" />
          <span>Customer favorite</span>
        </div>
        <div className="productdisplay-right-prices">
          <span className="productdisplay-right-price-new">{formatINR(product.new_price)}</span>
          {Number(product.old_price) > Number(product.new_price) && (
            <span className="productdisplay-right-price-old">{formatINR(product.old_price)}</span>
          )}
        </div>
        <p className="productdisplay-right-description">
          {product.description || "A considered everyday essential, made for comfort and easy styling. A versatile addition to your wardrobe, ready for wherever the day takes you."}
        </p>
        <button type="button" className="productdisplay-add-button" onClick={handleAddToCart}>
          Add to bag · {formatINR(product.new_price)}
        </button>
        <div className="productdisplay-promise">
          <span>Easy returns</span>
          <span>Secure checkout</span>
          <span>Made for everyday</span>
        </div>
      </div>
    </section>
  );
};

export default ProductDisplay;
