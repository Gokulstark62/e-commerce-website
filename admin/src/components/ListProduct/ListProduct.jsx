import React, { useCallback, useEffect, useState } from "react";
import "./ListProduct.css";
import { toast } from "react-toastify";
import { formatINR } from "../../utils/currency";

const ListProduct = () => {
  const backendUrl = process.env.REACT_APP_API_URL || "http://localhost:4000";
  const token = localStorage.getItem("token");
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch(`${backendUrl}/api/products`);
      const products = await response.json();
      if (response.ok) {
        setAllProducts(products);
      } else {
        toast.error(products.error || "Unable to load products.");
      }
    } catch (error) {
      toast.error("Could not reach the server. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const removeProduct = async (id) => {
    if (!window.confirm("Remove this product from your store?")) return;
    setDeletingId(id);
    try {
      const response = await fetch(`${backendUrl}/api/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error || "Unable to remove the product.");
        return;
      }
      setAllProducts((products) => products.filter((product) => product.id !== id));
      toast.success("Product removed.");
    } catch (error) {
      toast.error("Could not reach the server. Check that the backend is running.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="list-product">
      <header className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">CATALOG</p>
          <h1>
            Products <span className="product-count">{allProducts.length}</span>
          </h1>
          <p className="admin-muted">Manage the items shown in your storefront.</p>
        </div>
      </header>
      <div className="listproduct-format-main">
        <p>Image</p>
        <p>Product</p>
        <p>Regular price</p>
        <p>Selling price</p>
        <p>Category</p>
        <p>Action</p>
      </div>
      <div className="listproduct-allproducts">
        {loading && <p className="product-list-message">Loading products...</p>}
        {!loading && allProducts.length === 0 && (
          <p className="product-list-message">
            No products yet. Add your first product to start selling.
          </p>
        )}
        {allProducts.map((product) => (
          <div className="listproduct-row" key={product.id}>
            <div className="listproduct-format-main listproduct-format">
              <img src={product.image} alt={product.name} className="listproduct-product-icon" />
              <div className="listproduct-name">
                <p>{product.name}</p>
                {product.description && <span>{product.description}</span>}
              </div>
              <p>{formatINR(product.old_price)}</p>
              <p>{formatINR(product.new_price)}</p>
              <p className="product-category">{product.category}</p>
              <button
                type="button"
                onClick={() => removeProduct(product.id)}
                disabled={deletingId === product.id}
                className="listproduct-remove-button"
              >
                {deletingId === product.id ? "Removing..." : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ListProduct;
