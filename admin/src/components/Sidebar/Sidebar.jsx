import React from "react";
import './Sidebar.css'
import {NavLink} from 'react-router-dom';
import add_product_icon from '../../assets/Product_Cart.svg'
import list_product_icon from './../../assets/Product_list_icon.svg'
import order_icon from './../../assets/order_icon.png'

const Sidebar = () => {
    return ( 
        <div className="sidebar">
            <NavLink to={'/addproduct'} className={({isActive}) => isActive ? "sidebar-item sidebar-item-active" : "sidebar-item"}>
                    <img src={add_product_icon} alt="" />
                    <p>Add Product</p>
            </NavLink>
            <NavLink to={'/listproduct'} className={({isActive}) => isActive ? "sidebar-item sidebar-item-active" : "sidebar-item"}>
                    <img src={list_product_icon} alt="" />
                    <p>Product List</p>
            </NavLink>
            <NavLink to={'/listorder'} className={({isActive}) => isActive ? "sidebar-item sidebar-item-active" : "sidebar-item"}>
                    <img src={order_icon} alt="" />
                    <p>Orders</p>
            </NavLink>
        </div>
     );
}
 
export default Sidebar;