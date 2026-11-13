import React, { useContext, useState } from "react";
import "./Navbar.css";
import logo from "../../assets/logo.png";
import cart_icon from "../../assets/cart_icon.png";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import hamburger from "../../assets/hamburger.png";
import profile_icon from "../../assets/profile_icon.png";

const Navbar = () => {
  const { getTotalCartItems } = useContext(StoreContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = Boolean(localStorage.getItem("token"));

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
    window.location.reload();
  };

  const menuClass = (path) =>
    location.pathname === path ? "nav-link nav-link-active" : "nav-link";

  return (
    <header className="navbar">
      <Link to="/" className="nav-logo" aria-label="SS Stylo Fashion home">
        <img src={logo} alt="" />
        <span>SS Stylo <strong>Fashion</strong></span>
      </Link>
      <button
        type="button"
        className="nav-hamburger"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label={menuOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={menuOpen}
      >
        <img src={hamburger} alt="" />
      </button>
      <nav className={`nav-menu ${menuOpen ? "nav-menu-visible" : ""}`}>
        <Link className={menuClass("/")} to="/" onClick={() => setMenuOpen(false)}>Home</Link>
        <Link className={menuClass("/men")} to="/men" onClick={() => setMenuOpen(false)}>Men</Link>
        <Link className={menuClass("/women")} to="/women" onClick={() => setMenuOpen(false)}>Women</Link>
        <Link className={menuClass("/kids")} to="/kids" onClick={() => setMenuOpen(false)}>Kids</Link>
      </nav>
      <div className="nav-actions">
        {isLoggedIn ? (
          <div className="navbar-profile">
            <button type="button" className="profile-button" aria-label="Account menu">
              <img src={profile_icon} alt="" />
            </button>
            <div className="nav-profile-dropdown">
              <Link to="/myorders">My orders</Link>
              <button type="button" onClick={logout}>Sign out</button>
            </div>
          </div>
        ) : (
          <Link className="nav-signin" to="/login">Sign in</Link>
        )}
        <Link className="nav-cart-link" to="/cart" aria-label={`Shopping bag, ${getTotalCartItems()} items`}>
          <img src={cart_icon} alt="" />
          <span className="nav-cart-count">{getTotalCartItems()}</span>
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
