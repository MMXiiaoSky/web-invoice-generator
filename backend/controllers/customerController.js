const { db } = require('../config/db');

// Get all customers (filtered by user)
exports.getAllCustomers = (req, res) => {
  const userId = req.user.id;
  
  db.all('SELECT * FROM customers WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    res.json(rows);
  });
};

// Get customer by ID (only if owned by user)
exports.getCustomerById = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.get('SELECT * FROM customers WHERE id = ? AND user_id = ?', [id, userId], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }

    if (!row) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(row);
  });
};

// Create customer
exports.createCustomer = (req, res) => {
  const { company_name, address, attention, telephone } = req.body;
  const user_id = req.user.id;

  if (!company_name) {
    return res.status(400).json({ message: 'Company name is required' });
  }

  db.run(
    'INSERT INTO customers (company_name, address, attention, telephone, user_id) VALUES (?, ?, ?, ?, ?)',
    [company_name, address, attention, telephone, user_id],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error creating customer', error: err.message });
      }

      res.status(201).json({ 
        message: 'Customer created successfully',
        customerId: this.lastID 
      });
    }
  );
};

// Update customer (only if owned by user)
exports.updateCustomer = (req, res) => {
  const { id } = req.params;
  const { company_name, address, attention, telephone } = req.body;
  const userId = req.user.id;

  db.run(
    'UPDATE customers SET company_name = ?, address = ?, attention = ?, telephone = ? WHERE id = ? AND user_id = ?',
    [company_name, address, attention, telephone, id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error updating customer', error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Customer not found or access denied' });
      }

      res.json({ message: 'Customer updated successfully' });
    }
  );
};

// Delete customer (only if owned by user)
exports.deleteCustomer = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.run('DELETE FROM customers WHERE id = ? AND user_id = ?', [id, userId], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error deleting customer', error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Customer not found or access denied' });
    }

    res.json({ message: 'Customer deleted successfully' });
  });
};