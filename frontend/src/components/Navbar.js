import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h2>📋 Invoice Generator</h2>
      </div>
      <div className="navbar-user">
        <span className="user-name">👤 {user?.name}</span>
        <span className="user-role">{user?.role === 'admin' ? '🔑 Admin' : '👥 User'}</span>
        <button onClick={handleLogout} className="btn-logout">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;