import './App.css';
import { useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Receipt from './pages/Receipt';
import ReturnExchange from './pages/ReturnExchange';

function App() {
  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem('accessToken')
  );

  return (
    <BrowserRouter>

      <Routes>

        {/* =========================
            LOGIN / DASHBOARD
        ========================= */}

        <Route
          path="/"
          element={
            loggedIn ? (
              <Dashboard
                onLogout={() => {
                  setLoggedIn(false);
                }}
              />
            ) : (
              <Login
                onLogin={() => {
                  setLoggedIn(true);
                }}
              />
            )
          }
        />


        {/* =========================
            RECEIPT
        ========================= */}

        <Route
          path="/receipt/:id"
          element={<Receipt />}
        />


        {/* =========================
            RETURN / EXCHANGE
        ========================= */}

        <Route
          path="/return-exchange"
          element={<ReturnExchange />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;