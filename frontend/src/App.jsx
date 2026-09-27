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

function App() {
  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem('accessToken')
  );

  return (
    <BrowserRouter>

      <Routes>

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

        <Route
          path="/receipt/:id"
          element={<Receipt />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;