const { db } = require('../config/db');

// Get all templates (filtered by user)
exports.getAllTemplates = (req, res) => {
  const userId = req.user.id;
  
  db.all('SELECT * FROM templates WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }

    const templates = rows.map(row => ({
      ...row,
      template_data: JSON.parse(row.template_data)
    }));

    res.json(templates);
  });
};

// Get template by ID (only if owned by user)
exports.getTemplateById = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.get('SELECT * FROM templates WHERE id = ? AND user_id = ?', [id, userId], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }

    if (!row) {
      return res.status(404).json({ message: 'Template not found' });
    }

    const template = {
      ...row,
      template_data: JSON.parse(row.template_data)
    };

    res.json(template);
  });
};

// Create template
exports.createTemplate = (req, res) => {
  const { name, template_data } = req.body;
  const user_id = req.user.id;

  if (!name || !template_data) {
    return res.status(400).json({ message: 'Name and template data are required' });
  }

  db.run(
    'INSERT INTO templates (name, template_data, user_id) VALUES (?, ?, ?)',
    [name, JSON.stringify(template_data), user_id],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error creating template', error: err.message });
      }

      res.status(201).json({ 
        message: 'Template created successfully',
        templateId: this.lastID 
      });
    }
  );
};

// Update template (only if owned by user)
exports.updateTemplate = (req, res) => {
  const { id } = req.params;
  const { name, template_data } = req.body;
  const userId = req.user.id;

  db.run(
    'UPDATE templates SET name = ?, template_data = ? WHERE id = ? AND user_id = ?',
    [name, JSON.stringify(template_data), id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error updating template', error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Template not found or access denied' });
      }

      res.json({ message: 'Template updated successfully' });
    }
  );
};

// Delete template (only if owned by user)
exports.deleteTemplate = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.run('DELETE FROM templates WHERE id = ? AND user_id = ?', [id, userId], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error deleting template', error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Template not found or access denied' });
    }

    res.json({ message: 'Template deleted successfully' });
  });
};