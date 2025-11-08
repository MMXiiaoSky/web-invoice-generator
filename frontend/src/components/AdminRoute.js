import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin()) {
    return <Navigate to="/" />;
  }

  return (
    <>
      <Sidebar />
      <Navbar />
      <div style={{ marginLeft: '260px', marginTop: '70px', padding: '20px' }}>
        {children}
      </div>
    </>
  );
};

export default AdminRoute;