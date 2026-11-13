import React, { useContext } from 'react';
import './NewCollections.css';
import Item from '../Item/Item'
import { StoreContext } from '../../context/StoreContext';

const NewCollections = () => {
    const {all_product} = useContext(StoreContext);
    const new_collection = all_product.slice(-8).reverse();
    return ( 
        <div className="new-collections">
            <div className="section-heading">
                <div>
                    <p className="section-kicker">FRESH ARRIVALS</p>
                    <h1>Just landed</h1>
                </div>
                <span>Pieces you'll reach for again and again</span>
            </div>
            <div className="collections">
                {new_collection.map((item,i)=>{
                   return <Item key={i} id={item.id} name={item.name} image={item.image} new_price={item.new_price} old_price={item.old_price}/>
                })}
            </div>
            {!new_collection.length && <p className="empty-catalog">Our next collection is being prepared.</p>}
        </div>
     );
}
 
export default NewCollections;