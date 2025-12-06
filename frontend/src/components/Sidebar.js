import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { isAdmin } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>Menu</h3>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          📊 Dashboard
        </NavLink>
        <NavLink to="/invoices" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          📄 Invoices
        </NavLink>
        <NavLink to="/invoices/create" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          ➕ Create Invoice
        </NavLink>
        <NavLink to="/quotations" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          🧾 Quotations
        </NavLink>
        <NavLink to="/quotations/create" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          ➕ Create Quotation
        </NavLink>
        <NavLink to="/customers" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          👥 Customers
        </NavLink>
        <NavLink to="/items" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          📦 Items
        </NavLink>
        <NavLink to="/templates" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          🎨 Templates
        </NavLink>
        {isAdmin() && (
          <NavLink to="/users" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            🔐 User Management
          </NavLink>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;