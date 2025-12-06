const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotationController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, quotationController.getAllQuotations);
router.get('/:id', authenticateToken, quotationController.getQuotationById);
router.post('/', authenticateToken, quotationController.createQuotation);
router.put('/:id', authenticateToken, quotationController.updateQuotation);
router.delete('/:id', authenticateToken, quotationController.deleteQuotation);

module.exports = router;
