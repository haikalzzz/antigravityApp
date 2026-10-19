const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Endpoint login publik
router.post('/login', authController.login);

// Endpoint logout
router.post('/logout', authController.logout);

// Endpoint verifikasi token (opsional / helper)
router.get('/verify', authenticateToken, authController.verifyToken);

module.exports = router;
