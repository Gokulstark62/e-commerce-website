import React, { useEffect, useState } from "react";
import "./AddProduct.css";
import upload_area from "./../../assets/upload_area.svg";
import { toast } from "react-toastify";

const initialProduct = {
  name: "",
  category: "women",
  new_price: "",
  old_price: "",
  description: "",
};

const AddProduct = () => {
  const backendUrl = process.env.REACT_APP_API_URL || "http://localhost:4000";
  const token = localStorage.getItem("token");
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [productDetails, setProductDetails] = useState(initialProduct);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!image) return undefined;
    const previewUrl = URL.createObjectURL(image);
    setPreviewUrl(previewUrl);
    return () => {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    };
  }, [image]);

  const imageHandler = (event) => {
    setImage(event.target.files?.[0] || null);
  };

  const changeHandler = (event) => {
    setProductDetails((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const addProduct = async (event) => {
    event.preventDefault();
    if (!image) {
      toast.error("Choose a product image.");
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    Object.entries(productDetails).forEach(([key, value]) => formData.append(key, value));
    formData.append("product", image);

    try {
      const response = await fetch(`${backendUrl}/api/products`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error || "Unable to add this product.");
        return;
      }

      setProductDetails(initialProduct);
      setImage(null);
      event.target.reset();
      toast.success("Product added to your store.");
    } catch (error) {
      toast.error("Could not reach the server. Check that the backend is running.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="add-product" onSubmit={addProduct}>
      <header className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">CATALOG</p>
          <h1>Add a product</h1>
          <p className="admin-muted">Create a new item for your storefront.</p>
        </div>
      </header>
      <div className="addproduct-itemfield">
        <label htmlFor="product-name">Product name</label>
        <input
          id="product-name"
          value={productDetails.name}
          onChange={changeHandler}
          type="text"
          name="name"
          placeholder="e.g. Everyday cotton shirt"
          maxLength="100"
          required
        />
      </div>
      <div className="addproduct-price">
        <div className="addproduct-itemfield">
          <label htmlFor="regular-price">Regular price (₹)</label>
          <input
            id="regular-price"
            value={productDetails.old_price}
            onChange={changeHandler}
            type="number"
            name="old_price"
            placeholder="0.00"
            min="0.01"
            step="0.01"
            required
          />
        </div>
        <div className="addproduct-itemfield">
          <label htmlFor="offer-price">Selling price (₹)</label>
          <input
            id="offer-price"
            value={productDetails.new_price}
            onChange={changeHandler}
            type="number"
            name="new_price"
            placeholder="0.00"
            min="0.01"
            step="0.01"
            required
          />
        </div>
      </div>
      <div className="addproduct-price">
        <div className="addproduct-itemfield">
          <label htmlFor="product-category">Category</label>
          <select
            id="product-category"
            value={productDetails.category}
            onChange={changeHandler}
            name="category"
            className="add-product-selector"
          >
            <option value="women">Women</option>
            <option value="men">Men</option>
            <option value="kids">Kids</option>
          </select>
        </div>
        <div className="addproduct-itemfield">
          <label htmlFor="product-description">Description</label>
          <input
            id="product-description"
            value={productDetails.description}
            onChange={changeHandler}
            type="text"
            name="description"
            placeholder="A short description (optional)"
            maxLength="500"
          />
        </div>
      </div>
      <div className="addproduct-itemfield">
        <label htmlFor="file-input">Product image</label>
        <label className="addproduct-upload" htmlFor="file-input">
          <img
            src={previewUrl || upload_area}
            alt={image ? "Selected product preview" : "Choose a product image"}
            className="addproduct-thumbnail-img"
          />
          <span>{image ? image.name : "Choose an image · JPG, PNG, WebP or GIF · up to 5 MB"}</span>
        </label>
        <input
          onChange={imageHandler}
          accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
          type="file"
          name="image"
          id="file-input"
          hidden
          required
        />
      </div>
      <button type="submit" disabled={submitting} className="addproduct-btn">
        {submitting ? "Adding product..." : "Add product"}
      </button>
    </form>
  );
};

export default AddProduct;
