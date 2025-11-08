const { db } = require('../config/db');

// Get all items (filtered by user)
exports.getAllItems = (req, res) => {
  const userId = req.user.id;
  
  db.all('SELECT * FROM items WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    res.json(rows);
  });
};

// Get item by ID (only if owned by user)
exports.getItemById = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.get('SELECT * FROM items WHERE id = ? AND user_id = ?', [id, userId], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }

    if (!row) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json(row);
  });
};

// Create item
exports.createItem = (req, res) => {
  const { description, unit_price } = req.body;
  const user_id = req.user.id;

  if (!description || !unit_price) {
    return res.status(400).json({ message: 'Description and unit price are required' });
  }

  db.run(
    'INSERT INTO items (description, unit_price, user_id) VALUES (?, ?, ?)',
    [description, parseFloat(unit_price), user_id],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error creating item', error: err.message });
      }

      res.status(201).json({ 
        message: 'Item created successfully',
        itemId: this.lastID 
      });
    }
  );
};

// Update item (only if owned by user)
exports.updateItem = (req, res) => {
  const { id } = req.params;
  const { description, unit_price } = req.body;
  const userId = req.user.id;

  db.run(
    'UPDATE items SET description = ?, unit_price = ? WHERE id = ? AND user_id = ?',
    [description, parseFloat(unit_price), id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error updating item', error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Item not found or access denied' });
      }

      res.json({ message: 'Item updated successfully' });
    }
  );
};

// Delete item (only if owned by user)
exports.deleteItem = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.run('DELETE FROM items WHERE id = ? AND user_id = ?', [id, userId], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error deleting item', error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Item not found or access denied' });
    }

    res.json({ message: 'Item deleted successfully' });
  });
};