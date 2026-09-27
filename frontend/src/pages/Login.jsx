import { useState } from 'react';
import api from '../api/api';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post('/auth/login', {
        username,
        password,
      });

      localStorage.setItem(
        'accessToken',
        response.data.accessToken,
      );

      setMessage('Login successful');

      onLogin();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        'Login failed',
      );
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">

        <h1>Glam By HH</h1>
        <p>Admin Login</p>

        <form onSubmit={handleLogin}>

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />

          <button type="submit">
            Login
          </button>

        </form>

        {message && (
          <p>{message}</p>
        )}

      </div>
    </div>
  );
}

export default Login;