import React, { useState, useEffect } from 'react';
import { itemsAPI } from '../utils/api';

const ItemList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    unit_price: ''
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await itemsAPI.getAll();
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `RM ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        description: item.description,
        unit_price: item.unit_price
      });
    } else {
      setEditingItem(null);
      setFormData({
        description: '',
        unit_price: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({
      description: '',
      unit_price: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingItem) {
        await itemsAPI.update(editingItem.id, formData);
        alert('Item updated successfully!');
      } else {
        await itemsAPI.create(formData);
        alert('Item created successfully!');
      }
      handleCloseModal();
      fetchItems();
    } catch (error) {
      alert('Error saving item');
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await itemsAPI.delete(id);
        alert('Item deleted successfully');
        fetchItems();
      } catch (error) {
        alert('Error deleting item');
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading items...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Items</h1>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          ➕ Add Item
        </button>
      </div>

      <div className="card">
        {items.length === 0 ? (
          <div className="empty-state">
            <h3>No items yet</h3>
            <p>Add your first item to get started!</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Unit Price</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.description}</strong></td>
                    <td>{formatCurrency(item.unit_price)}</td>
                    <td>{new Date(item.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="btn btn-secondary btn-small"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
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
              <h2>{editingItem ? 'Edit Item' : 'Add Item'}</h2>
              <button onClick={handleCloseModal} className="close-btn">&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Description *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="Enter item description"
                />
              </div>

              <div className="form-group">
                <label>Unit Price (RM) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                  required
                  placeholder="Enter unit price"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemList;