const { db } = require('../config/db');

// Generate quotation number: YYYYMMDD_XXX (per user)
const generateQuotationNumber = (userId, callback) => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

  const prefix = `${dateStr}_`;

  db.get(
    `SELECT quotation_number FROM quotations WHERE quotation_number LIKE ? AND user_id = ? ORDER BY quotation_number DESC LIMIT 1`,
    [`${prefix}%`, userId],
    (err, row) => {
      if (err) {
        return callback(err, null);
      }

      let nextNumber = 1;
      if (row) {
        const lastNumber = parseInt(row.quotation_number.split('_')[1]);
        nextNumber = lastNumber + 1;
      }

      const quotationNumber = `${prefix}${String(nextNumber).padStart(3, '0')}`;
      callback(null, quotationNumber);
    }
  );
};

// Get all quotations (filtered by user)
exports.getAllQuotations = (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT q.*, c.company_name as customer_name, t.name as template_name
    FROM quotations q
    LEFT JOIN customers c ON q.customer_id = c.id
    LEFT JOIN templates t ON q.template_id = t.id
    WHERE q.user_id = ?
    ORDER BY q.created_at DESC
  `;

  db.all(query, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }

    const quotations = rows.map(row => ({
      ...row,
      items: JSON.parse(row.items)
    }));

    res.json(quotations);
  });
};

// Get quotation by ID (only if owned by user)
exports.getQuotationById = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const query = `
    SELECT q.*, c.company_name, c.address, c.attention, c.telephone,
           t.name as template_name, t.template_data
    FROM quotations q
    LEFT JOIN customers c ON q.customer_id = c.id
    LEFT JOIN templates t ON q.template_id = t.id
    WHERE q.id = ? AND q.user_id = ?
  `;

  db.get(query, [id, userId], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }

    if (!row) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    const quotation = {
      ...row,
      items: JSON.parse(row.items),
      template_data: row.template_data ? JSON.parse(row.template_data) : null
    };

    res.json(quotation);
  });
};

// Create quotation
exports.createQuotation = (req, res) => {
  const { customer_id, template_id, items, subtotal, total, quotation_date } = req.body;
  const user_id = req.user.id;

  if (!customer_id || !template_id || !items || !subtotal || !total || !quotation_date) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  generateQuotationNumber(user_id, (err, quotationNumber) => {
    if (err) {
      return res.status(500).json({ message: 'Error generating quotation number', error: err.message });
    }

    db.run(
      `INSERT INTO quotations (quotation_number, customer_id, template_id, items, subtotal, tax, total, quotation_date, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [quotationNumber, customer_id, template_id, JSON.stringify(items), subtotal, 0, total, quotation_date, user_id],
      function(err) {
        if (err) {
          return res.status(500).json({ message: 'Error creating quotation', error: err.message });
        }

        res.status(201).json({
          message: 'Quotation created successfully',
          quotationId: this.lastID,
          quotationNumber
        });
      }
    );
  });
};

// Update quotation (only if owned by user)
exports.updateQuotation = (req, res) => {
  const { id } = req.params;
  const { customer_id, template_id, items, subtotal, total, quotation_date } = req.body;
  const userId = req.user.id;

  db.run(
    `UPDATE quotations
     SET customer_id = ?, template_id = ?, items = ?, subtotal = ?, tax = 0, total = ?, quotation_date = ?
     WHERE id = ? AND user_id = ?`,
    [customer_id, template_id, JSON.stringify(items), subtotal, total, quotation_date, id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error updating quotation', error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Quotation not found or access denied' });
      }

      res.json({ message: 'Quotation updated successfully' });
    }
  );
};

// Delete quotation (only if owned by user)
exports.deleteQuotation = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.run('DELETE FROM quotations WHERE id = ? AND user_id = ?', [id, userId], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error deleting quotation', error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Quotation not found or access denied' });
    }

    res.json({ message: 'Quotation deleted successfully' });
  });
};
