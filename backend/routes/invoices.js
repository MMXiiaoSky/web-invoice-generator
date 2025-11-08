const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, invoiceController.getAllInvoices);
router.get('/stats', authenticateToken, invoiceController.getInvoiceStats);
router.get('/:id', authenticateToken, invoiceController.getInvoiceById);
router.post('/', authenticateToken, invoiceController.createInvoice);
router.put('/:id', authenticateToken, invoiceController.updateInvoice);
router.patch('/:id/status', authenticateToken, invoiceController.updateInvoiceStatus);
router.delete('/:id', authenticateToken, invoiceController.deleteInvoice);

module.exports = router;