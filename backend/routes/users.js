const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

router.get('/', authenticateToken, isAdmin, userController.getAllUsers);
router.post('/', authenticateToken, isAdmin, userController.createUser);
router.put('/:id', authenticateToken, isAdmin, userController.updateUser);
router.delete('/:id', authenticateToken, isAdmin, userController.deleteUser);

module.exports = router;