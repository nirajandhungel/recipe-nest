'use strict';

const { Router } = require('express');
const { authenticate, requireAdmin } = require('../middlewares/auth.middleware');
const { apiLimiter } = require('../middlewares/ratelimit.middleware');
const adminController = require('../controllers/admin.controller');

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin, apiLimiter);

// User management
router.get('/users', adminController.getUsers);
router.get('/users/:userId', adminController.getUserById);
router.post('/users/:userId/status', adminController.updateUserStatus);
router.post('/users/:userId/suspend', (req, res, next) => {
  req.body.status = 'suspended';
  adminController.updateUserStatus(req, res, next);
});
router.post('/users/:userId/activate', (req, res, next) => {
  req.body.status = 'active';
  adminController.updateUserStatus(req, res, next);
});
router.patch('/users/:userId/featured', adminController.toggleChefFeatured);
router.delete('/users/:userId', adminController.deleteUser);
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/audit-logs/export', adminController.exportAuditLogs);

// Recipe moderation
router.get('/recipes/pending', adminController.getPendingRecipes);
router.patch('/recipes/:recipeId/status', adminController.updateRecipeStatus);
router.post('/recipes/:recipeId/approve', adminController.approveRecipe);
router.post('/recipes/:recipeId/reject', adminController.rejectRecipe);
router.post('/recipes/:recipeId/flag', adminController.flagRecipe);

// Statistics
router.get('/stats', adminController.getStats);
router.get('/stats/users', adminController.getUserStats);
router.get('/stats/recipes', adminController.getRecipeStats);

module.exports = router;
