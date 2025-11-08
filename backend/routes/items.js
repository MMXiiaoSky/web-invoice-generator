const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, itemController.getAllItems);
router.get('/:id', authenticateToken, itemController.getItemById);
router.post('/', authenticateToken, itemController.createItem);
router.put('/:id', authenticateToken, itemController.updateItem);
router.delete('/:id', authenticateToken, itemController.deleteItem);

module.exports = router;