'use strict';

const { Router } = require('express');
const { RecipeController } = require('../controllers/recipe.controller');
const { authenticate, optionalAuth, requireChef } = require('../middlewares/auth.middleware');
const { uploadImageFile } = require('../middlewares/upload.middleware');
const { uploadLimiter, apiLimiter } = require('../middlewares/ratelimit.middleware');

const router = Router();

// Public routes
router.get('/', apiLimiter, optionalAuth, RecipeController.getRecipes);
router.get('/chef/:chefId', apiLimiter, RecipeController.getChefRecipes);
router.get('/:id', apiLimiter, optionalAuth, RecipeController.getRecipe);

// Protected routes (Chef only) — uploadImageFile expects field name 'image'
router.post('/', uploadLimiter, authenticate, requireChef, uploadImageFile, RecipeController.createRecipe);
router.put('/:id', authenticate, requireChef, uploadImageFile, RecipeController.updateRecipe);
router.delete('/:id', authenticate, requireChef, RecipeController.deleteRecipe);
router.post('/:id/publish', authenticate, requireChef, RecipeController.publishRecipe);

module.exports = router;