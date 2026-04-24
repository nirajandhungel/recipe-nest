'use strict';

const { Router } = require('express');
const { Recipe } = require('../models/recipe.model');
const { Profile } = require('../models/profile.model');
const { User } = require('../models/user.model');
const { Follow } = require('../models/social.model');
const { optionalAuth } = require('../middlewares/auth.middleware');
const { buildProfileImageMap, attachProfileImage } = require('../utils/profile-image');

const router = Router();

// Search recipes
router.get('/recipes', async (req, res) => {
  try {
    const { q, cuisine, difficulty, mealType, limit = 20 } = req.query;
    const query = { isPublished: true, status: 'published' };
    
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }
    
    if (cuisine) query.cuisineType = cuisine;
    if (difficulty) query.difficulty = difficulty;
    if (mealType) query.mealType = mealType;

    const recipes = await Recipe.find(query)
      .populate('chefId', 'firstName lastName username')
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    const chefImageMap = await buildProfileImageMap(recipes.map((recipe) => recipe.chefId?._id));
    recipes.forEach((recipe) => {
      attachProfileImage(recipe.chefId, chefImageMap);
    });
      
    res.json({ success: true, data: { recipes } });
  } catch (err) {
    console.error('Search Recipes Error:', err);
    res.status(500).json({ success: false, message: 'Server error searching recipes' });
  }
});

// Search chefs
router.get('/chefs', optionalAuth, async (req, res) => {
  try {
    const { q, featured, limit = 20 } = req.query;
    const query = {};
    
    if (featured === 'true') {
      query.isFeatured = true;
    }

    if (q) {
      const users = await User.find({
        $or: [
          { firstName: { $regex: q, $options: 'i' } },
          { lastName: { $regex: q, $options: 'i' } },
          { username: { $regex: q, $options: 'i' } }
        ]
      }).select('_id');
      query.userId = { $in: users.map(u => u._id) };
    }
    
    const profiles = await Profile.find(query)
      .populate('userId', 'firstName lastName username email followerCount followingCount recipeCount role')
      .sort({ rating: -1 })
      .limit(Number(limit))
      .lean();

    // Always filter for chefs
    let chefs = profiles.filter(p => p.userId && p.userId.role === 'chef');

    if (req.user) {
      const chefUserIds = chefs.map(p => p.userId._id || p.userId);
      const follows = await Follow.find({
        followerId: req.user.userId,
        followingId: { $in: chefUserIds }
      });
      const followedIds = new Set(follows.map(f => f.followingId.toString()));
      chefs = chefs.map(p => ({
        ...p,
        isFollowing: followedIds.has((p.userId._id || p.userId).toString())
      }));
    }
      
    res.json({ success: true, data: { chefs } });
  } catch (err) {
    console.error('Search Chefs Error:', err);
    res.status(500).json({ success: false, message: 'Server error searching chefs' });
  }
});

// Trending recipes
router.get('/trending/recipes', async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    const recipes = await Recipe.find({ isPublished: true, status: 'published' })
      .populate('chefId', 'firstName lastName username')
      .sort({ views: -1, likes: -1 })
      .limit(Number(limit))
      .lean();
    const chefImageMap = await buildProfileImageMap(recipes.map((recipe) => recipe.chefId?._id));
    recipes.forEach((recipe) => {
      attachProfileImage(recipe.chefId, chefImageMap);
    });
    res.json({ success: true, data: { recipes } });
  } catch (err) {
    console.error('Trending Recipes Error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching trending recipes' });
  }
});

// Trending chefs
router.get('/trending/chefs', optionalAuth, async (req, res) => {
  try {
    const { limit = 4 } = req.query;
    
    // Find featured profiles
    const profiles = await Profile.find({ isFeatured: true })
      .populate('userId', 'firstName lastName username email followerCount recipeCount role')
      .sort({ totalLikes: -1, rating: -1 })
      .limit(Number(limit))
      .lean();

    // Filter to ensure only chefs are returned (in case an admin is featured)
    let featuredChefs = profiles.filter(p => p.userId && p.userId.role === 'chef');
    
    if (req.user) {
      const chefUserIds = featuredChefs.map(p => p.userId._id || p.userId);
      const follows = await Follow.find({
        followerId: req.user.userId,
        followingId: { $in: chefUserIds }
      });
      const followedIds = new Set(follows.map(f => f.followingId.toString()));
      featuredChefs = featuredChefs.map(p => ({
        ...p,
        isFollowing: followedIds.has((p.userId._id || p.userId).toString())
      }));
    }

    res.json({ success: true, data: { chefs: featuredChefs } });
  } catch (err) {
    console.error('Trending Chefs Error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching trending chefs' });
  }
});

// Trending tags (extra)
router.get('/tags', async (req, res) => {
  try {
    const recipes = await Recipe.find({ isPublished: true }).select('tags').limit(100);
    const tags = [...new Set(recipes.flatMap(r => r.tags || []))].slice(0, 20);
    res.json({ success: true, data: tags });
  } catch (err) {
    res.json({ success: true, data: [] });
  }
});

module.exports = router;
