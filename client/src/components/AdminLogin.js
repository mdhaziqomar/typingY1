import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/admin/login', credentials);
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('adminUsername', response.data.username);
      navigate('/admin/dashboard');
    } catch (error) {
      setError(error.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-base via-mantle to-crust">
      <div className="card max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">
            🛡️ Admin Panel
          </h1>
          <p className="text-subtext0">
            Chung Hwa Middle School BSB<br></br>Typing Competition Management
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-text mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              className="input-field w-full"
              placeholder="Enter username"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              className="input-field w-full"
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <div className="bg-red bg-opacity-20 border border-red text-red px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !credentials.username || !credentials.password}
            className="btn-primary w-full py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-crust mr-2"></div>
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-subtext0 text-sm">
            Default credentials: admin / admin123
          </p>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-blue hover:text-sapphire text-sm underline"
          >
            Back to Student Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 