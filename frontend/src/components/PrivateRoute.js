import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
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

export default PrivateRoute;