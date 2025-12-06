import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quotationsAPI, customersAPI, itemsAPI, templatesAPI } from '../utils/api';
import './InvoiceCreate.css';

const QuotationCreate = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [formData, setFormData] = useState({
    customer_id: '',
    template_id: '',
    quotation_date: new Date().toISOString().split('T')[0]
  });
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Custom item form
  const [showCustomItemForm, setShowCustomItemForm] = useState(false);
  const [customItem, setCustomItem] = useState({
    description: '',
    unit_price: '',
    quantity: 1
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [customersRes, itemsRes, templatesRes] = await Promise.all([
        customersAPI.getAll(),
        itemsAPI.getAll(),
        templatesAPI.getAll()
      ]);
      setCustomers(customersRes.data);
      setItems(itemsRes.data);
      setTemplates(templatesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const addItem = (itemId) => {
    const item = items.find(i => i.id === parseInt(itemId));
    if (item) {
      setSelectedItems([...selectedItems, {
        ...item,
        quantity: 1,
        total: item.unit_price,
        isCustom: false
      }]);
    }
  };

  const addCustomItem = () => {
    if (!customItem.description.trim() || !customItem.unit_price) {
      alert('Please enter description and unit price');
      return;
    }

    const unitPrice = parseFloat(customItem.unit_price);
    const quantity = parseInt(customItem.quantity) || 1;

    setSelectedItems([...selectedItems, {
      description: customItem.description,
      unit_price: unitPrice,
      quantity: quantity,
      total: unitPrice * quantity,
      isCustom: true
    }]);

    // Reset custom item form
    setCustomItem({
      description: '',
      unit_price: '',
      quantity: 1
    });
    setShowCustomItemForm(false);
  };

  const updateItemQuantity = (index, quantity) => {
    const updated = [...selectedItems];
    updated[index].quantity = parseInt(quantity);
    updated[index].total = updated[index].unit_price * updated[index].quantity;
    setSelectedItems(updated);
  };

  const removeItem = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + item.total, 0);
  };

  const formatCurrency = (amount) => {
    return `RM ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customer_id || !formData.template_id || selectedItems.length === 0) {
      alert('Please fill all required fields and add at least one item');
      return;
    }

    setLoading(true);
    const total = calculateTotal();

    try {
      await quotationsAPI.create({
        ...formData,
        items: selectedItems,
        subtotal: total,
        total: total
      });
      alert('Quotation created successfully!');
      navigate('/quotations');
    } catch (error) {
      alert('Error creating quotation');
    } finally {
      setLoading(false);
    }
  };

  const total = calculateTotal();

  return (
    <div>
      <div className="page-header">
        <h1>Create Quotation</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <h3>Quotation Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label>Customer *</label>
              <select
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                required
              >
                <option value="">Select Customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Template *</label>
              <select
                value={formData.template_id}
                onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                required
              >
                <option value="">Select Template</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Quotation Date *</label>
              <input
                type="date"
                value={formData.quotation_date}
                onChange={(e) => setFormData({ ...formData, quotation_date: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Items</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div className="form-group">
              <label>Add Saved Item</label>
              <select onChange={(e) => { addItem(e.target.value); e.target.value = ''; }}>
                <option value="">Select Item to Add</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.description} - {formatCurrency(item.unit_price)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>&nbsp;</label>
              <button
                type="button"
                onClick={() => setShowCustomItemForm(!showCustomItemForm)}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                {showCustomItemForm ? '✕ Cancel Custom Item' : '➕ Add Custom Item'}
              </button>
            </div>
          </div>

          {/* Custom Item Form */}
          {showCustomItemForm && (
            <div className="custom-item-form">
              <h4 style={{ marginBottom: '15px', color: '#666' }}>Custom Item (One-time use)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    value={customItem.description}
                    onChange={(e) => setCustomItem({ ...customItem, description: e.target.value })}
                    placeholder="Enter item description (multi-line supported)"
                    rows="3"
                    style={{ resize: 'vertical' }}
                  />
                  <small style={{ color: '#666', fontSize: '11px', marginTop: '5px', display: 'block' }}>
                    Press Enter for new lines
                  </small>
                </div>

                <div className="form-group">
                  <label>Unit Price (RM) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={customItem.unit_price}
                    onChange={(e) => setCustomItem({ ...customItem, unit_price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={customItem.quantity}
                    onChange={(e) => setCustomItem({ ...customItem, quantity: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={addCustomItem}
                className="btn btn-primary"
              >
                ✓ Add Custom Item
              </button>
            </div>
          )}

          {/* Items Table */}
          {selectedItems.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>No.</th>
                    <th>Description</th>
                    <th style={{ width: '130px' }}>Unit Price (RM)</th>
                    <th style={{ width: '100px' }}>Quantity</th>
                    <th style={{ width: '130px' }}>Total (RM)</th>
                    <th style={{ width: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItems.map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>
                        <div style={{ whiteSpace: 'pre-wrap' }}>
                          {item.description}
                        </div>
                        {item.isCustom && (
                          <span style={{
                            fontSize: '11px',
                            color: '#2196F3',
                            fontStyle: 'italic',
                            display: 'block',
                            marginTop: '3px'
                          }}>
                            ⓘ Custom Item
                          </span>
                        )}
                      </td>
                      <td>{formatCurrency(item.unit_price)}</td>
                      <td>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(index, e.target.value)}
                          min="1"
                          style={{ width: '70px', padding: '5px' }}
                        />
                      </td>
                      <td>{formatCurrency(item.total)}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="btn btn-danger btn-small"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedItems.length === 0 && (
            <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
              <p>No items added yet. Add items from your saved list or create custom items.</p>
            </div>
          )}

          <div style={{ marginTop: '20px', textAlign: 'right', borderTop: '2px solid #e0e0e0', paddingTop: '15px' }}>
            <h2>Total: {formatCurrency(total)}</h2>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => navigate('/quotations')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Quotation'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuotationCreate;
