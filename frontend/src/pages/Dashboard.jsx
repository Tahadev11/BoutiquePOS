// import React from 'react';
// import Products from './Products';
// import POS from './POS';
// import Sales from './Sales';

// function Dashboard({ onLogout }) {
//     const [page, setPage] = React.useState('dashboard');

//     const handleLogout = () => {
//         localStorage.removeItem('accessToken');
//         onLogout();
//     };

//     return (
//         <div className="dashboard-page">

//             <header className="dashboard-header">

//                 <div>
//                     <h1>Glam By HH</h1>
//                     <p>Admin Dashboard</p>
//                 </div>

//                 <button onClick={handleLogout}>
//                     Logout
//                 </button>

//             </header>

//             <nav className="dashboard-nav">

//                 <button onClick={() => setPage('dashboard')}>
//                     Dashboard
//                 </button>

//                 <button onClick={() => setPage('products')}>
//                     Products
//                 </button>

//                 <button onClick={() => setPage('pos')}>
//                     POS
//                 </button>

//                 <button onClick={() => setPage('sales')}>
//                     Sales
//                 </button>

//                 <button onClick={() => setPage('reports')}>
//                     Reports
//                 </button>

//             </nav>

//             <main className="dashboard-content">

//                 {page === 'dashboard' && (
//                     <>
//                         <h2>Dashboard</h2>

//                         <div className="dashboard-cards">

//                             <div className="dashboard-card">
//                                 <h3>Products</h3>
//                                 <p>Manage dresses and stock</p>
//                             </div>

//                             <div className="dashboard-card">
//                                 <h3>POS</h3>
//                                 <p>Create new sales</p>
//                             </div>

//                             <div className="dashboard-card">
//                                 <h3>Sales</h3>
//                                 <p>View previous sales</p>
//                             </div>

//                             <div className="dashboard-card">
//                                 <h3>Reports</h3>
//                                 <p>View business reports</p>
//                             </div>

//                         </div>
//                     </>
//                 )}

//                 {page === 'products' && (
//                     <Products />
//                 )}

//                 {page === 'pos' && (
//                     <POS />
//                 )}

//                 {page === 'sales' && (
//                     <Sales />
//                 )}

//                 {page === 'reports' && (
//                     <h2>Reports — Coming Next</h2>
//                 )}

//             </main>

//         </div>
//     );
// }

// export default Dashboard;


import React from 'react';
import Products from './Products';
import POS from './POS';
import Sales from './Sales';

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

                    <button
                        className={page === 'dashboard' ? 'active' : ''}
                        onClick={() => setPage('dashboard')}
                    >
                        <span>⌂</span>
                        Dashboard
                    </button>

                    <button
                        className={page === 'products' ? 'active' : ''}
                        onClick={() => setPage('products')}
                    >
                        <span>◈</span>
                        Products
                    </button>

                    <button
                        className={page === 'pos' ? 'active' : ''}
                        onClick={() => setPage('pos')}
                    >
                        <span>＋</span>
                        New Sale
                    </button>

                    <button
                        className={page === 'sales' ? 'active' : ''}
                        onClick={() => setPage('sales')}
                    >
                        <span>▣</span>
                        Sales
                    </button>

                    <button
                        className={page === 'reports' ? 'active' : ''}
                        onClick={() => setPage('reports')}
                    >
                        <span>◫</span>
                        Reports
                    </button>

                </nav>

                <div className="sidebar-bottom">

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
                            {page === 'reports' && 'Reports'}
                        </h1>

                        <p>
                            Welcome back to Glam By HH
                        </p>
                    </div>

                </header>

                <main className="dashboard-content">

                    {page === 'dashboard' && (
                        <>
                            <div className="dashboard-welcome">
                                <div>
                                    <h2>Welcome to Glam By HH ✨</h2>
                                    <p>
                                        Manage your boutique, products,
                                        sales and inventory from one place.
                                    </p>
                                </div>
                            </div>

                            <div className="dashboard-cards">

                                <div
                                    className="dashboard-card"
                                    onClick={() => setPage('products')}
                                >
                                    <h3>Products</h3>
                                    <p>Manage dresses and stock</p>
                                </div>

                                <div
                                    className="dashboard-card"
                                    onClick={() => setPage('pos')}
                                >
                                    <h3>New Sale</h3>
                                    <p>Create a new customer sale</p>
                                </div>

                                <div
                                    className="dashboard-card"
                                    onClick={() => setPage('sales')}
                                >
                                    <h3>Sales</h3>
                                    <p>View previous sales</p>
                                </div>

                                <div
                                    className="dashboard-card"
                                    onClick={() => setPage('reports')}
                                >
                                    <h3>Reports</h3>
                                    <p>View business reports</p>
                                </div>

                            </div>
                        </>
                    )}

                    {page === 'products' && (
                        <Products />
                    )}

                    {page === 'pos' && (
                        <POS />
                    )}

                    {page === 'sales' && (
                        <Sales />
                    )}

                    {page === 'reports' && (
                        <div className="coming-soon">
                            <h2>Reports</h2>
                            <p>Reports — Coming Next</p>
                        </div>
                    )}

                </main>

            </div>

        </div>
    );
}

export default Dashboard;