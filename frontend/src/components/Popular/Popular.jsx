import React, { useContext } from 'react'
import './Popular.css'
import Item from './../Item/Item'
import { StoreContext } from '../../context/StoreContext';

const Popular = () => {
    const {all_product} = useContext(StoreContext);
    const popularInWomen = all_product.filter((item) => item.category === 'women').slice(0, 4);
    return ( 
        <div className="popular">
            <div className="section-heading">
                <div>
                    <p className="section-kicker">THE EDIT</p>
                    <h1>Popular right now</h1>
                </div>
                <span>Women · Customer favorites</span>
            </div>
            <div className="popular-item">
                {popularInWomen.map((item,i)=>{
                    return <Item key={i} id={item.id} name={item.name} image={item.image} new_price={item.new_price} old_price={item.old_price}/>
                })}
            </div>
            {!popularInWomen.length && <p className="empty-catalog">New favorites are on their way. Check back soon.</p>}
        </div>
    );
}
 
export default Popular;