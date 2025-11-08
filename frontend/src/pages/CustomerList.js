import React, { useState, useEffect } from 'react';
import { customersAPI } from '../utils/api';
import './CustomerList.css';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    company_name: '',
    address: '',
    attention: '',
    telephone: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await customersAPI.getAll();
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        company_name: customer.company_name,
        address: customer.address || '',
        attention: customer.attention || '',
        telephone: customer.telephone || ''
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        company_name: '',
        address: '',
        attention: '',
        telephone: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    setFormData({
      company_name: '',
      address: '',
      attention: '',
      telephone: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingCustomer) {
        await customersAPI.update(editingCustomer.id, formData);
        alert('Customer updated successfully!');
      } else {
        await customersAPI.create(formData);
        alert('Customer created successfully!');
      }
      handleCloseModal();
      fetchCustomers();
    } catch (error) {
      alert('Error saving customer');
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customersAPI.delete(id);
        alert('Customer deleted successfully');
        fetchCustomers();
      } catch (error) {
        alert('Error deleting customer');
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading customers...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Customers</h1>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          ➕ Add Customer
        </button>
      </div>

      <div className="card">
        {customers.length === 0 ? (
          <div className="empty-state">
            <h3>No customers yet</h3>
            <p>Add your first customer to get started!</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Address</th>
                  <th>Contact Person</th>
                  <th>Telephone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(customer => (
                  <tr key={customer.id}>
                    <td><strong>{customer.company_name}</strong></td>
                    <td>{customer.address || '-'}</td>
                    <td>{customer.attention || '-'}</td>
                    <td>{customer.telephone || '-'}</td>
                    <td>
                      <button
                        onClick={() => handleOpenModal(customer)}
                        className="btn btn-secondary btn-small"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
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

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h2>
              <button onClick={handleCloseModal} className="close-btn">&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  required
                  placeholder="Enter company name"
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter address"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Contact Person (Attention)</label>
                <input
                  type="text"
                  value={formData.attention}
                  onChange={(e) => setFormData({ ...formData, attention: e.target.value })}
                  placeholder="Enter contact person name"
                />
              </div>

              <div className="form-group">
                <label>Telephone</label>
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  placeholder="Enter telephone number"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCustomer ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;