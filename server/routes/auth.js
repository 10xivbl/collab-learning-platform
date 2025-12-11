const express = require('express');
const router = express.Router();
const { register, login, getMe, logout } = require('../controllers/auth');
const { protect } = require('../middleware/auth');

// public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// protected routes
router.get('/me', protect, getMe);

module.exports = router;