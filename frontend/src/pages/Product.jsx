import React, { useContext } from "react";
import {StoreContext} from '../context/StoreContext'
import {useParams} from 'react-router-dom';
import Breadcrumb from "./../components/Breadcrumbs/Breadcrumbs"
import ProductDisplay from "../components/ProductDisplay/ProductDisplay";
import { Link } from "react-router-dom";

const Product = () => {
    const {all_product} = useContext(StoreContext)
    const {productId} = useParams();
    const product = all_product.find((e)=>e.id===Number(productId));
    if (!product) {
        return (
            <div className="product-not-found">
                <h1>We couldn't find that piece.</h1>
                <p>It may have sold out or the link may be incorrect.</p>
                <Link to="/">Back to the collection</Link>
            </div>
        );
    }
    return ( 
        <div>
            <Breadcrumb product={product}/>
            <ProductDisplay product={product}/>
        </div> 
    );
}
 
export default Product;