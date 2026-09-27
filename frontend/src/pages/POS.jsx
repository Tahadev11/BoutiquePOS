import { useEffect, useState } from 'react';
import api from '../api/api';

function POS() {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [cart, setCart] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [completedSale, setCompletedSale] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchProducts = async () => {
        try {
            setLoading(true);

            const response = await api.get('/products');

            setProducts(response.data);
        } catch (error) {
            console.error(error);

            setMessage(
                error.response?.data?.message ||
                'Failed to load products',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

const filteredProducts = products.filter((product) => {
    const searchText = search.toLowerCase();

    return (
        product.dressName
            ?.toLowerCase()
            .includes(searchText) ||

        product.category
            ?.toLowerCase()
            .includes(searchText) ||

        product.brand
            ?.toLowerCase()
            .includes(searchText)
    );
});

    const addToCart = (product) => {
        setMessage('');

        if (product.stockQuantity <= 0) {
            setMessage('This dress is out of stock');
            return;
        }

        const existingItem = cart.find(
            (item) => item.productId === product._id
        );

        if (existingItem) {
            if (
                existingItem.quantity >=
                product.stockQuantity
            ) {
                setMessage('Not enough stock available');
                return;
            }

            setCart(
                cart.map((item) =>
                    item.productId === product._id
                        ? {
                            ...item,
                            quantity: item.quantity + 1,
                        }
                        : item
                )
            );

            return;
        }

        setCart([
            ...cart,
            {
                productId: product._id,
                dressName: product.dressName,
                actualPrice: product.actualPrice,
                discount: product.discount || 0,
                stockQuantity: product.stockQuantity,
                quantity: 1,
            },
        ]);
    };

    const updateQuantity = (productId, quantity) => {
        const item = cart.find(
            (item) => item.productId === productId
        );

        if (!item) {
            return;
        }

        if (quantity < 1) {
            return;
        }

        if (quantity > item.stockQuantity) {
            setMessage('Not enough stock available');
            return;
        }

        setCart(
            cart.map((item) =>
                item.productId === productId
                    ? {
                        ...item,
                        quantity,
                    }
                    : item
            )
        );
    };

    const removeFromCart = (productId) => {
        setCart(
            cart.filter(
                (item) => item.productId !== productId
            )
        );
    };

    const calculateSalePrice = (item) => {
        return (
            item.actualPrice -
            (item.actualPrice * item.discount) / 100
        );
    };

    const calculateSubtotal = (item) => {
        return calculateSalePrice(item) * item.quantity;
    };

    const totalAmount = cart.reduce(
        (total, item) =>
            total + calculateSubtotal(item),
        0
    );

    const handleCheckout = async () => {
        if (cart.length === 0) {
            setMessage('Cart is empty');
            return;
        }

        try {
            setLoading(true);
            setMessage('');

            const checkoutData = {
                items: cart.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                })),

                paymentMethod,
            };

            const response = await api.post(
                '/sales/checkout',
                checkoutData
            );

            setMessage('Checkout successful');

            setCompletedSale(response.data.sale);

            setCart([]);

            fetchProducts();

            console.log('Sale:', response.data.sale);

        } catch (error) {
            console.error(error);

            setMessage(
                error.response?.data?.message ||
                'Checkout failed'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pos-page">

            <h2>POS</h2>
            {message && (
                <p className="pos-message">
                    {message}
                </p>
            )}

            {completedSale && (
                <button
                    className="view-receipt-button"
                    onClick={() => {
                        window.open(
                            `/receipt/${completedSale._id}`,
                            '_blank'
                        );
                    }}
                >
                    View Receipt
                </button>
            )}

            <div className="pos-layout">

                {/* PRODUCTS */}

                <div className="pos-products">

                    <h3>Find Dress</h3>

                    <div className="pos-search">

                        <input
                            type="text"
                            placeholder="Search dress, category or brand..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                        />

                    </div>

                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        <div className="pos-product-list">

                            {filteredProducts.length === 0 ? (
                                <p>No dresses found</p>
                            ) : (
                                filteredProducts.map((product) => {

                                    const salePrice =
                                        product.actualPrice -
                                        (
                                            product.actualPrice *
                                            (product.discount || 0) /
                                            100
                                        );

                                    return (
                                        <div
                                            className="pos-product-card"
                                            key={product._id}
                                        >

                                            <h4>
                                                {product.dressName}
                                            </h4>

                                            <p>
                                                Category: {product.category}
                                            </p>

                                            <p>
                                                Brand: {product.brand}
                                            </p>

                                            <p>
                                                Size: {product.size}
                                            </p>

                                            <p>
                                                Color: {product.color}
                                            </p>

                                            <p>
                                                Price: Rs.{' '}
                                                {product.actualPrice}
                                            </p>

                                            <p>
                                                Discount:{' '}
                                                {product.discount || 0}%
                                            </p>

                                            <strong>
                                                Sale Price: Rs.{' '}
                                                {salePrice}
                                            </strong>

                                            <p>
                                                Stock:{' '}
                                                {product.stockQuantity}
                                            </p>

                                            <button
                                                onClick={() =>
                                                    addToCart(product)
                                                }
                                                disabled={
                                                    product.stockQuantity <= 0
                                                }
                                            >
                                                {product.stockQuantity <= 0
                                                    ? 'Out of Stock'
                                                    : 'Add to Cart'}
                                            </button>

                                        </div>
                                    );
                                })
                            )}

                        </div>
                    )}

                </div>

                {/* CART */}

                <div className="pos-cart">

                    <h3>Cart</h3>

                    {cart.length === 0 ? (
                        <p>
                            No items in cart
                        </p>
                    ) : (
                        <>
                            {cart.map((item) => {

                                const salePrice =
                                    calculateSalePrice(item);

                                const subtotal =
                                    calculateSubtotal(item);

                                return (
                                    <div
                                        className="cart-item"
                                        key={item.productId}
                                    >

                                        <div>
                                            <h4>
                                                {item.dressName}
                                            </h4>

                                            <p>
                                                Rs. {salePrice} ×{' '}
                                                {item.quantity}
                                            </p>

                                            <p>
                                                Discount:{' '}
                                                {item.discount}%
                                            </p>
                                        </div>

                                        <div className="cart-controls">

                                            <button
                                                onClick={() =>
                                                    updateQuantity(
                                                        item.productId,
                                                        item.quantity - 1
                                                    )
                                                }
                                            >
                                                -
                                            </button>

                                            <span>
                                                {item.quantity}
                                            </span>

                                            <button
                                                onClick={() =>
                                                    updateQuantity(
                                                        item.productId,
                                                        item.quantity + 1
                                                    )
                                                }
                                            >
                                                +
                                            </button>

                                        </div>

                                        <strong>
                                            Rs. {subtotal}
                                        </strong>

                                        <button
                                            className="remove-cart-button"
                                            onClick={() =>
                                                removeFromCart(item.productId)
                                            }
                                        >
                                            Remove
                                        </button>
                                    </div>
                                );
                            })}

                            <div className="cart-total">

                                <h3>
                                    Total: Rs. {totalAmount}
                                </h3>

                            </div>

                            <div className="payment-method">

                                <h4>
                                    Payment Method
                                </h4>

                                <label>
                                    <input
                                        type="radio"
                                        value="cash"
                                        checked={
                                            paymentMethod === 'cash'
                                        }
                                        onChange={(e) =>
                                            setPaymentMethod(
                                                e.target.value
                                            )
                                        }
                                    />
                                    Cash
                                </label>

                                <label>
                                    <input
                                        type="radio"
                                        value="card"
                                        checked={
                                            paymentMethod === 'card'
                                        }
                                        onChange={(e) =>
                                            setPaymentMethod(
                                                e.target.value
                                            )
                                        }
                                    />
                                    Card
                                </label>

                            </div>

                            <button
                                className="checkout-button"
                                onClick={handleCheckout}
                                disabled={loading}
                            >
                                {loading
                                    ? 'Processing...'
                                    : 'Checkout'}
                            </button>

                        </>
                    )}

                </div>

            </div>

        </div>
    );
}

export default POS;