import React from "react";
import './Admin.css';
import Sidebar from "../../components/Sidebar/Sidebar";
import {Routes,Route} from 'react-router-dom';
import {Navigate} from 'react-router-dom';
import {useContext} from 'react';
import AddProduct from "../../components/AddProduct/AddProduct";
import ListProduct from "../../components/ListProduct/ListProduct";
import ListOrder from "../../components/ListOrder/ListOrder";
import Login from "./../../components/Login/Login"
import {StoreContext} from "../../context/StoreContext";

const Admin = () => {
    const {admin, token} = useContext(StoreContext);
    const requireAdmin = (page) => admin && token ? page : <Navigate to="/" replace />;
    return ( 
        <div className="admin">
            {admin && token && <Sidebar/>}
            <Routes>
                <Route path='/' element={<Login/>}/>
                <Route path='/addproduct' element={requireAdmin(<AddProduct/>)} />
                <Route path='/listproduct' element={requireAdmin(<ListProduct/>)} />
                <Route path="/listorder" element={requireAdmin(<ListOrder/>)} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
     );
}
 
export default Admin;