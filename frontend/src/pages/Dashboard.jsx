import React from 'react';
import Products from './Products';
import POS from './POS';
import Sales from './Sales';
import Suppliers from './Suppliers';
import ReturnExchange from './ReturnExchange';

function Dashboard({ onLogout }) {
    const [page, setPage] = React.useState('dashboard');

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        onLogout();
    };

    return (
        <div className="dashboard-layout">

            {/* SIDEBAR */}
            <aside className="dashboard-sidebar">

                <div className="sidebar-brand">
                    <h1>Glam By HH</h1>
                    <p>Boutique POS</p>
                </div>

                <nav className="sidebar-nav">

                    {/* Dashboard */}
                    <button
                        className={page === 'dashboard' ? 'active' : ''}
                        onClick={() => setPage('dashboard')}
                    >
                        <span>⌂</span>
                        Dashboard
                    </button>

                    {/* Products */}
                    <button
                        className={page === 'products' ? 'active' : ''}
                        onClick={() => setPage('products')}
                    >
                        <span>◈</span>
                        Products
                    </button>

                    {/* New Sale */}
                    <button
                        className={page === 'pos' ? 'active' : ''}
                        onClick={() => setPage('pos')}
                    >
                        <span>＋</span>
                        New Sale
                    </button>

                    {/* Sales */}
                    <button
                        className={page === 'sales' ? 'active' : ''}
                        onClick={() => setPage('sales')}
                    >
                        <span>▣</span>
                        Sales
                    </button>

                    {/* Return / Exchange */}
                    <button
                        className={page === 'return-exchange' ? 'active' : ''}
                        onClick={() => setPage('return-exchange')}
                    >
                        <span>↔</span>
                        Return / Exchange
                    </button>

                    {/* Suppliers */}
                    <button
                        className={page === 'suppliers' ? 'active' : ''}
                        onClick={() => setPage('suppliers')}
                    >
                        <span>♢</span>
                        Suppliers
                    </button>

                </nav>

                <div className="sidebar-bottom">

                    {/* Logout */}
                    <button
                        className="sidebar-logout"
                        onClick={handleLogout}
                    >
                        <span>↪</span>
                        Logout
                    </button>

                </div>

            </aside>


            {/* MAIN AREA */}
            <div className="dashboard-main">

                <header className="dashboard-header">

                    <div>

                        <h1>
                            {page === 'dashboard' && 'Dashboard'}
                            {page === 'products' && 'Products'}
                            {page === 'pos' && 'New Sale'}
                            {page === 'sales' && 'Sales'}
                            {page === 'return-exchange' && 'Return / Exchange'}
                            {page === 'suppliers' && 'Suppliers'}
                        </h1>

                        <p>
                            Welcome back to Glam By HH
                        </p>

                    </div>

                </header>


                <main className="dashboard-content">

                    {/* =========================
                        DASHBOARD HOME
                    ========================= */}

                    {page === 'dashboard' && (
                        <>

                            <div className="dashboard-welcome">

                                <div>

                                    <h2>
                                        Welcome to Glam By HH ✨
                                    </h2>

                                    <p>
                                        Manage your boutique, products,
                                        sales, suppliers, returns,
                                        exchanges and inventory
                                        from one place.
                                    </p>

                                </div>

                            </div>


                            <div className="dashboard-cards">

                                {/* Products */}
                                <div
                                    className="dashboard-card"
                                    onClick={() => setPage('products')}
                                >
                                    <h3>
                                        Products
                                    </h3>

                                    <p>
                                        Manage dresses and stock
                                    </p>
                                </div>


                                {/* New Sale */}
                                <div
                                    className="dashboard-card"
                                    onClick={() => setPage('pos')}
                                >
                                    <h3>
                                        New Sale
                                    </h3>

                                    <p>
                                        Create a new customer sale
                                    </p>
                                </div>


                                {/* Sales */}
                                <div
                                    className="dashboard-card"
                                    onClick={() => setPage('sales')}
                                >
                                    <h3>
                                        Sales
                                    </h3>

                                    <p>
                                        View previous sales
                                    </p>
                                </div>


                                {/* Return / Exchange */}
                                <div
                                    className="dashboard-card"
                                    onClick={() => setPage('return-exchange')}
                                >
                                    <h3>
                                        Return / Exchange
                                    </h3>

                                    <p>
                                        Process customer returns
                                        and exchanges
                                    </p>
                                </div>


                                {/* Suppliers */}
                                <div
                                    className="dashboard-card"
                                    onClick={() => setPage('suppliers')}
                                >
                                    <h3>
                                        Suppliers
                                    </h3>

                                    <p>
                                        Manage suppliers and balances
                                    </p>
                                </div>

                            </div>

                        </>
                    )}


                    {/* =========================
                        PRODUCTS
                    ========================= */}

                    {page === 'products' && (
                        <Products />
                    )}


                    {/* =========================
                        POS
                    ========================= */}

                    {page === 'pos' && (
                        <POS />
                    )}


                    {/* =========================
                        SALES
                    ========================= */}

                    {page === 'sales' && (
                        <Sales />
                    )}


                    {/* =========================
                        RETURN / EXCHANGE
                    ========================= */}

                    {page === 'return-exchange' && (
                        <ReturnExchange />
                    )}


                    {/* =========================
                        SUPPLIERS
                    ========================= */}

                    {page === 'suppliers' && (
                        <Suppliers />
                    )}

                </main>

            </div>

        </div>
    );
}

export default Dashboard;