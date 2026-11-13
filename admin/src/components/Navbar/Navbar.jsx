import React,{useContext} from "react";
import {StoreContext} from "./../../context/StoreContext";
import './Navbar.css'
import profile_icon from './../../assets/profile_icon.png'
import {useNavigate} from 'react-router-dom';
import { toast} from "react-toastify";


const Navbar = () => {
    const navigate = useNavigate();
    const {token, admin, setAdmin, setToken} = useContext(StoreContext);
    const logout = ()=>{
        localStorage.removeItem("token");
        localStorage.removeItem("admin");
        setToken("");
        setAdmin(false);
        toast.success("Logged out successfully")
        window.location.replace("/");
    }
    return ( 
        <div className="navbar">
            <p className="nav-logo">SS Stylo Fashion <span>Admin</span></p>
            {(token && admin)?(<p className="login-condition" onClick={logout}>Logout</p>):(<p className="login-condition" onClick={()=>navigate("/")}>Login</p>)}
            <img src={profile_icon} alt="" className="nav-profile"/>
        </div> 
    );
}
 
export default Navbar;