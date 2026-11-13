import React, { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {StoreContext} from '../context/StoreContext'
import './CSS/ShopCategory.css'
import Item from './../components/Item/Item'

const ShopCategory = (props) => {
    const {all_product} = useContext(StoreContext);
    const [sort, setSort] = useState("featured");
    const products = useMemo(() => {
        const categoryProducts = all_product.filter((item) => item.category === props.category);
        if (sort === "price-low") return [...categoryProducts].sort((a, b) => a.new_price - b.new_price);
        if (sort === "price-high") return [...categoryProducts].sort((a, b) => b.new_price - a.new_price);
        return categoryProducts;
    }, [all_product, props.category, sort]);
    const categoryName = props.category[0].toUpperCase() + props.category.slice(1);
    return ( 
        <div className="shop-category">
            <div className="category-banner-wrap">
                <img className="shopCategory-banner" src={props.banner} alt={`${categoryName} clothing collection`} />
                <div className="category-banner-copy">
                    <p className="section-kicker">THE EVERYDAY EDIT</p>
                    <h1>{categoryName}, in your style.</h1>
                    <span>Thoughtful fits. Better everyday essentials.</span>
                </div>
            </div>
            <div className="category-toolbar">
                <p><strong>{products.length}</strong> pieces to explore</p>
                <label>
                    Sort by
                    <select value={sort} onChange={(event) => setSort(event.target.value)}>
                        <option value="featured">Featured</option>
                        <option value="price-low">Price: low to high</option>
                        <option value="price-high">Price: high to low</option>
                    </select>
                </label>
            </div>
            <div className="shopCategory-products">
                {products.map((item)=>(
                    <Item key={item.id} id={item.id} name={item.name} image={item.image} new_price={item.new_price} old_price={item.old_price}/>
                ))}
            </div>
            {!products.length && (
                <div className="category-empty">
                    <h2>Nothing here just yet</h2>
                    <p>We’re getting the next {props.category} edit ready.</p>
                    <Link to="/">Explore the full collection</Link>
                </div>
            )}
        </div>
     );
}
 
export default ShopCategory;