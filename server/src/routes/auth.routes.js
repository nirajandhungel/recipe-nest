'use strict';

const { Router } = require('express');
const { AuthController } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authLimiter } = require('../middlewares/ratelimit.middleware');

const router = Router();

// Public routes (with rate limiting)
router.post('/register', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);
router.post('/refresh', AuthController.refreshToken);   // FIX: added token refresh endpoint
router.post('/forgot-password', authLimiter, AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.post('/verify-email', AuthController.verifyEmail);

// Protected routes
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.getCurrentUser);

module.exports = router;