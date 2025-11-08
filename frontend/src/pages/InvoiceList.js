import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { invoicesAPI } from '../utils/api';

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', search: '' });

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await invoicesAPI.getAll();
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `RM ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await invoicesAPI.delete(id);
        fetchInvoices();
      } catch (error) {
        alert('Error deleting invoice');
      }
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await invoicesAPI.updateStatus(id, status);
      fetchInvoices();
    } catch (error) {
      alert('Error updating status');
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesStatus = !filter.status || invoice.status === filter.status;
    const matchesSearch = !filter.search || 
      invoice.invoice_number.toLowerCase().includes(filter.search.toLowerCase()) ||
      invoice.customer_name.toLowerCase().includes(filter.search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) return <div className="loading">Loading invoices...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Invoices</h1>
        <Link to="/invoices/create" className="btn btn-primary">
          ➕ Create Invoice
        </Link>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search by invoice # or customer..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
          />
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
          >
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="empty-state">
            <h3>No invoices found</h3>
            <p>Create your first invoice to get started!</p>
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
                {filteredInvoices.map(invoice => (
                  <tr key={invoice.id}>
                    <td>{invoice.invoice_number}</td>
                    <td>{invoice.customer_name}</td>
                    <td>{formatDate(invoice.invoice_date)}</td>
                    <td>{formatCurrency(invoice.total)}</td>
                    <td>
                      <select
                        value={invoice.status}
                        onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                        className={`badge ${invoice.status === 'paid' ? 'badge-success' : 'badge-warning'}`}
                        style={{ border: 'none', cursor: 'pointer' }}
                      >
                        <option value="paid">PAID</option>
                        <option value="unpaid">UNPAID</option>
                      </select>
                    </td>
                    <td>
                      <Link to={`/invoices/${invoice.id}`} className="btn btn-secondary btn-small">
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(invoice.id)}
                        className="btn btn-danger btn-small"
                      >
                        Delete
                      </button>
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

export default InvoiceList;