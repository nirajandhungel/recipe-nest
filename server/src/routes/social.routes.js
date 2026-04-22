'use strict';

const { Router } = require('express');
const { SocialController } = require('../controllers/social.controller');
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');
const { apiLimiter } = require('../middlewares/ratelimit.middleware');

const router = Router();

// Like routes
router.post('/:recipeId/like', apiLimiter, authenticate, SocialController.likeRecipe);
router.delete('/:recipeId/like', apiLimiter, authenticate, SocialController.unlikeRecipe);
router.get('/:recipeId/liked', apiLimiter, authenticate, SocialController.isRecipeLiked);

// Comment routes
router.post('/:recipeId/comments', apiLimiter, authenticate, SocialController.addComment);
router.get('/:recipeId/comments', apiLimiter, optionalAuth, SocialController.getComments);
router.delete('/comments/:commentId', apiLimiter, authenticate, SocialController.deleteComment);

// Save routes
router.post('/:recipeId/save', apiLimiter, authenticate, SocialController.saveRecipe);
router.delete('/:recipeId/save', apiLimiter, authenticate, SocialController.unsaveRecipe);

// Follow routes
router.post('/users/:userId/follow', apiLimiter, authenticate, SocialController.followChef);
router.delete('/users/:userId/follow', apiLimiter, authenticate, SocialController.unfollowChef);
router.get('/users/:userId/followers', apiLimiter, optionalAuth, SocialController.getFollowers);
router.get('/users/:userId/following', apiLimiter, optionalAuth, SocialController.getFollowing);

// Saved recipes
router.get('/users/me/saves', apiLimiter, authenticate, SocialController.getSavedRecipes);

module.exports = router;
