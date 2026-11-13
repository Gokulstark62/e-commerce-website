import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import './Item.css'
import { formatINR } from '../../utils/currency';
import { StoreContext } from '../../context/StoreContext';

const Item = (props) => {
    const { addToCart } = useContext(StoreContext);
    return ( 
        <div className="item">
            <Link className="item-image-link" to={`/product/${props.id}`} onClick={() => window.scrollTo(0, 0)}>
                <img src={props.image} alt={props.name} loading="lazy" />
                <span className="item-view-label">View details</span>
            </Link>
            <div className="item-details">
                <Link to={`/product/${props.id}`} className="item-name">{props.name}</Link>
                <div className="item-prices">
                    <span className="item-price-new">{formatINR(props.new_price)}</span>
                    {Number(props.old_price) > Number(props.new_price) && (
                        <span className="item-price-old">{formatINR(props.old_price)}</span>
                    )}
                </div>
                <button type="button" className="item-add-button" onClick={() => addToCart(props.id)}>
                    Add to bag
                </button>
            </div>
        </div>
     );
}
 
export default Item;