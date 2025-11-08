const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, templateController.getAllTemplates);
router.get('/:id', authenticateToken, templateController.getTemplateById);
router.post('/', authenticateToken, templateController.createTemplate);
router.put('/:id', authenticateToken, templateController.updateTemplate);
router.delete('/:id', authenticateToken, templateController.deleteTemplate);

module.exports = router;