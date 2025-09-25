const express = require('express');
const { login, register, refreshToken, logout } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Login endpoint
router.post('/login', login);

// Register endpoint (admin only)
router.post('/register', authenticateToken, register);

// Refresh token endpoint
router.post('/refresh', authenticateToken, refreshToken);

// Logout endpoint
router.post('/logout', authenticateToken, logout);

module.exports = router;