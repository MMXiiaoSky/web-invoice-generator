const { db } = require('../config/db');

// Generate invoice number: YYYYMMDD_XXX (per user)
const generateInvoiceNumber = (userId, callback) => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  
  const prefix = `${dateStr}_`;

  db.get(
    `SELECT invoice_number FROM invoices WHERE invoice_number LIKE ? AND user_id = ? ORDER BY invoice_number DESC LIMIT 1`,
    [`${prefix}%`, userId],
    (err, row) => {
      if (err) {
        return callback(err, null);
      }

      let nextNumber = 1;
      if (row) {
        const lastNumber = parseInt(row.invoice_number.split('_')[1]);
        nextNumber = lastNumber + 1;
      }

      const invoiceNumber = `${prefix}${String(nextNumber).padStart(3, '0')}`;
      callback(null, invoiceNumber);
    }
  );
};

// Get all invoices (filtered by user)
exports.getAllInvoices = (req, res) => {
  const userId = req.user.id;
  
  const query = `
    SELECT i.*, c.company_name as customer_name, t.name as template_name
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    LEFT JOIN templates t ON i.template_id = t.id
    WHERE i.user_id = ?
    ORDER BY i.created_at DESC
  `;

  db.all(query, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }

    const invoices = rows.map(row => ({
      ...row,
      items: JSON.parse(row.items)
    }));

    res.json(invoices);
  });
};

// Get invoice by ID (only if owned by user)
exports.getInvoiceById = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const query = `
    SELECT i.*, c.company_name, c.address, c.attention, c.telephone,
           t.name as template_name, t.template_data
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    LEFT JOIN templates t ON i.template_id = t.id
    WHERE i.id = ? AND i.user_id = ?
  `;

  db.get(query, [id, userId], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }

    if (!row) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const invoice = {
      ...row,
      items: JSON.parse(row.items),
      template_data: row.template_data ? JSON.parse(row.template_data) : null
    };

    res.json(invoice);
  });
};

// Create invoice
exports.createInvoice = (req, res) => {
  const { customer_id, template_id, items, subtotal, total, invoice_date, status = 'unpaid' } = req.body;
  const user_id = req.user.id;

  if (!customer_id || !template_id || !items || !subtotal || !total || !invoice_date) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  generateInvoiceNumber(user_id, (err, invoiceNumber) => {
    if (err) {
      return res.status(500).json({ message: 'Error generating invoice number', error: err.message });
    }

    db.run(
      `INSERT INTO invoices (invoice_number, customer_id, template_id, items, subtotal, tax, total, status, invoice_date, user_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [invoiceNumber, customer_id, template_id, JSON.stringify(items), subtotal, 0, total, status, invoice_date, user_id],
      function(err) {
        if (err) {
          return res.status(500).json({ message: 'Error creating invoice', error: err.message });
        }

        res.status(201).json({ 
          message: 'Invoice created successfully',
          invoiceId: this.lastID,
          invoiceNumber
        });
      }
    );
  });
};

// Update invoice (only if owned by user)
exports.updateInvoice = (req, res) => {
  const { id } = req.params;
  const { customer_id, template_id, items, subtotal, total, status, invoice_date } = req.body;
  const userId = req.user.id;

  db.run(
    `UPDATE invoices 
     SET customer_id = ?, template_id = ?, items = ?, subtotal = ?, tax = 0, total = ?, status = ?, invoice_date = ?
     WHERE id = ? AND user_id = ?`,
    [customer_id, template_id, JSON.stringify(items), subtotal, total, status, invoice_date, id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error updating invoice', error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Invoice not found or access denied' });
      }

      res.json({ message: 'Invoice updated successfully' });
    }
  );
};

// Update invoice status (only if owned by user)
exports.updateInvoiceStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id;

  if (!['paid', 'unpaid'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  db.run(
    'UPDATE invoices SET status = ? WHERE id = ? AND user_id = ?',
    [status, id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error updating status', error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Invoice not found or access denied' });
      }

      res.json({ message: 'Invoice status updated successfully' });
    }
  );
};

// Delete invoice (only if owned by user)
exports.deleteInvoice = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.run('DELETE FROM invoices WHERE id = ? AND user_id = ?', [id, userId], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error deleting invoice', error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Invoice not found or access denied' });
    }

    res.json({ message: 'Invoice deleted successfully' });
  });
};

// Get invoice statistics (filtered by user)
exports.getInvoiceStats = (req, res) => {
  const userId = req.user.id;
  
  db.all(
    `SELECT 
      COUNT(*) as total_invoices,
      SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_invoices,
      SUM(CASE WHEN status = 'unpaid' THEN 1 ELSE 0 END) as unpaid_invoices,
      SUM(total) as total_amount,
      SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as paid_amount,
      SUM(CASE WHEN status = 'unpaid' THEN total ELSE 0 END) as unpaid_amount
    FROM invoices
    WHERE user_id = ?`,
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      res.json(rows[0]);
    }
  );
};