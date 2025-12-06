import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { quotationsAPI } from '../utils/api';

const QuotationList = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ search: '' });

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const response = await quotationsAPI.getAll();
      setQuotations(response.data);
    } catch (error) {
      console.error('Error fetching quotations:', error);
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
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      try {
        await quotationsAPI.delete(id);
        fetchQuotations();
      } catch (error) {
        alert('Error deleting quotation');
      }
    }
  };

  const filteredQuotations = quotations.filter(quotation => {
    const searchTerm = filter.search.toLowerCase();
    const matchesSearch = !filter.search ||
      quotation.quotation_number.toLowerCase().includes(searchTerm) ||
      (quotation.customer_name || '').toLowerCase().includes(searchTerm);
    return matchesSearch;
  });

  if (loading) return <div className="loading">Loading quotations...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Quotations</h1>
        <Link to="/quotations/create" className="btn btn-primary">
          ➕ Create Quotation
        </Link>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search by quotation # or customer..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
          />
        </div>

        {filteredQuotations.length === 0 ? (
          <div className="empty-state">
            <h3>No quotations found</h3>
            <p>Create your first quotation to get started!</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Quotation No.</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Total (RM)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotations.map(quotation => (
                  <tr key={quotation.id}>
                    <td>{quotation.quotation_number}</td>
                    <td>{quotation.customer_name}</td>
                    <td>{formatDate(quotation.quotation_date)}</td>
                    <td>{formatCurrency(quotation.total)}</td>
                    <td>
                      <Link to={`/quotations/${quotation.id}`} className="btn btn-secondary btn-small">
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(quotation.id)}
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

export default QuotationList;
