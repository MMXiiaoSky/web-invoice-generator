import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { invoicesAPI, customersAPI, itemsAPI } from '../utils/api';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalInvoices: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0
  });
  const [counts, setCounts] = useState({
    customers: 0,
    items: 0
  });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, invoicesRes, customersRes, itemsRes] = await Promise.all([
        invoicesAPI.getStats(),
        invoicesAPI.getAll(),
        customersAPI.getAll(),
        itemsAPI.getAll()
      ]);

      setStats(statsRes.data);
      setRecentInvoices(invoicesRes.data.slice(0, 5));
      setCounts({
        customers: customersRes.data.length,
        items: itemsRes.data.length
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `RM ${(amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <Link to="/invoices/create" className="btn btn-primary">
          ➕ Create Invoice
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Invoices</h3>
          <div className="value">{stats.total_invoices || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Paid Invoices</h3>
          <div className="value" style={{color: '#4CAF50'}}>{stats.paid_invoices || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Unpaid Invoices</h3>
          <div className="value" style={{color: '#ff9800'}}>{stats.unpaid_invoices || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <div className="value">{formatCurrency(stats.total_amount)}</div>
        </div>
        <div className="stat-card">
          <h3>Total Customers</h3>
          <div className="value">{counts.customers}</div>
        </div>
        <div className="stat-card">
          <h3>Total Items</h3>
          <div className="value">{counts.items}</div>
        </div>
      </div>

      <div className="card">
        <h2>Recent Invoices</h2>
        {recentInvoices.length === 0 ? (
          <div className="empty-state">
            <p>No invoices yet. Create your first invoice!</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Invoice No.</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Total (RM)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map(invoice => (
                  <tr key={invoice.id}>
                    <td>{invoice.invoice_number}</td>
                    <td>{invoice.customer_name}</td>
                    <td>{formatDate(invoice.invoice_date)}</td>
                    <td>{formatCurrency(invoice.total)}</td>
                    <td>
                      <span className={`badge ${invoice.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                        {invoice.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <Link to={`/invoices/${invoice.id}`} className="btn btn-secondary btn-small">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;