'use strict';

const { Router } = require('express');
const { ProfileController } = require('../controllers/profile.controller');
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');
const { uploadMixedFields, uploadSingleFile, uploadImageFile, uploadBannerFile } = require('../middlewares/upload.middleware');
const { apiLimiter } = require('../middlewares/ratelimit.middleware');

const router = Router();

// Public routes
router.get('/', apiLimiter, optionalAuth, ProfileController.getAllProfiles);
router.get('/search', apiLimiter, optionalAuth, ProfileController.searchChefs);
router.get('/:userId/stats', apiLimiter, optionalAuth, ProfileController.getChefStats);
router.get('/:userId', apiLimiter, optionalAuth, ProfileController.getProfile);

// Protected routes
router.get('/me/details', apiLimiter, authenticate, ProfileController.getCurrentProfile);
router.put('/me', apiLimiter, authenticate, ProfileController.updateProfile);
router.post('/me/image', apiLimiter, authenticate, uploadImageFile, ProfileController.uploadProfileImage);
router.post('/me/banner', apiLimiter, authenticate, uploadBannerFile, ProfileController.uploadBannerImage);

module.exports = router;
