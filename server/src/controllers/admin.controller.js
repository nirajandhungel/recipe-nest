'use strict';

const { User } = require('../models/user.model');
const { Recipe } = require('../models/recipe.model');
const { Profile } = require('../models/profile.model');
const { AuditLog } = require('../models/auditlog.model');
const { asyncHandler } = require('../middlewares/error.middleware');
const { getPaginationData } = require('../utils/helpers');

/**
 * Admin Controller for managing users and recipes
 */

// User Management
const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 15;
  const search = req.query.q || '';

  const query = {};
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { username: { $regex: search, $options: 'i' } }
    ];
  }

  const total = await User.countDocuments(query);
  const { skip, totalPages } = getPaginationData(total, page, limit);

  const users = await User.find(query)
    .select('-passwordHash')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Populate profiles to show featured status
  const userIds = users.map(u => u._id);
  const profiles = await Profile.find({ userId: { $in: userIds } }).select('userId isFeatured');
  
  const usersWithProfile = users.map(u => ({
    ...u,
    isFeatured: profiles.find(p => p.userId.toString() === u._id.toString())?.isFeatured || false
  }));

  res.json({ 
    success: true, 
    data: { 
      users: usersWithProfile,
      totalPages,
      total
    } 
  });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).select('-passwordHash');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const profile = await Profile.findOne({ userId: user._id });
  res.json({ success: true, data: { user, profile } });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;
  const user = await User.findByIdAndUpdate(userId, { status }, { new: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, message: `User status updated to ${status}`, data: user });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  await Profile.deleteOne({ userId: user._id });
  await Recipe.deleteMany({ chefId: user._id });
  res.json({ success: true, message: 'User and all related data deleted' });
});

// Recipe Moderation
const getPendingRecipes = asyncHandler(async (req, res) => {
  const recipes = await Recipe.find({ status: 'pending' })
    .populate('chefId', 'firstName lastName username')
    .sort({ updatedAt: -1 });
  res.json({ success: true, data: { recipes } });
});

const updateRecipeStatus = asyncHandler(async (req, res) => {
  const { recipeId } = req.params;
  const { status, isVerified } = req.body;

  const updateData = {};
  if (status) {
    updateData.status = status;
    updateData.isPublished = status === 'published';
  }
  if (isVerified !== undefined) {
    updateData.isVerified = isVerified;
  }

  const recipe = await Recipe.findByIdAndUpdate(recipeId, updateData, { new: true });

  if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });
  res.json({ success: true, message: 'Recipe updated successfully', data: recipe });
});

const approveRecipe = asyncHandler(async (req, res) => {
  const { recipeId } = req.params;
  const recipe = await Recipe.findByIdAndUpdate(recipeId, {
    status: 'published',
    isPublished: true,
  }, { new: true });

  if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });
  res.json({ success: true, message: 'Recipe approved and published', data: recipe });
});

const rejectRecipe = asyncHandler(async (req, res) => {
  const { recipeId } = req.params;
  const { reason = '' } = req.body;

  const recipe = await Recipe.findByIdAndUpdate(recipeId, {
    status: 'rejected',
    isPublished: false,
    rejectionReason: reason // Make sure to add this field to the model if needed, or just status
  }, { new: true });

  if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });
  res.json({ success: true, message: 'Recipe rejected', data: recipe });
});

const flagRecipe = asyncHandler(async (req, res) => {
  const { recipeId } = req.params;
  const recipe = await Recipe.findByIdAndUpdate(recipeId, {
    status: 'flagged',
  }, { new: true });

  if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });
  res.json({ success: true, message: 'Recipe flagged for review', data: recipe });
});

// Stats
const getStats = asyncHandler(async (req, res) => {
  const userCount = await User.countDocuments();
  const recipeCount = await Recipe.countDocuments();
  const chefCount = await User.countDocuments({ role: 'chef' });
  const publishedRecipeCount = await Recipe.countDocuments({ isPublished: true });

  res.json({
    success: true,
    data: {
      totalUsers: userCount,
      totalChefs: chefCount,
      totalRecipes: recipeCount,
      publishedRecipes: publishedRecipeCount
    }
  });
});

const getUserStats = asyncHandler(async (req, res) => {
  const [totalUsers, chefCount, adminCount, suspendedCount] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'chef' }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ status: 'suspended' })
  ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      suspendedUsers: suspendedCount,
      usersByRole: {
        user: totalUsers - chefCount - adminCount,
        chef: chefCount,
        admin: adminCount
      }
    }
  });
});

const getRecipeStats = asyncHandler(async (req, res) => {
  const [totalRecipes, publishedCount, draftCount, pendingCount, flaggedCount] = await Promise.all([
    Recipe.countDocuments(),
    Recipe.countDocuments({ status: 'published' }),
    Recipe.countDocuments({ status: 'draft' }),
    Recipe.countDocuments({ status: 'pending' }),
    Recipe.countDocuments({ status: 'flagged' })
  ]);

  res.json({
    success: true,
    data: {
      totalRecipes,
      publishedRecipes: publishedCount,
      draftRecipes: draftCount,
      pendingRecipes: pendingCount,
      flaggedRecipes: flaggedCount
    }
  });
});

const getAuditLogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  const total = await AuditLog.countDocuments();
  const { skip } = getPaginationData(total, page, limit);

  const logs = await AuditLog.find()
    .populate('adminId', 'firstName lastName username')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    data: logs,
    meta: getPaginationData(total, page, limit)
  });
});

const toggleChefFeatured = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { isFeatured } = req.body;

  // Find or create profile if it doesn't exist
  let profile = await Profile.findOne({ userId });
  
  if (!profile) {
    // If it's a chef, we can create a basic profile to feature them
    const user = await User.findById(userId);
    if (!user || user.role !== 'chef') {
      return res.status(400).json({ success: false, message: 'Only chefs can be featured' });
    }
    profile = await Profile.create({ userId, isFeatured });
  } else {
    profile.isFeatured = isFeatured;
    await profile.save();
  }

  res.json({ 
    success: true, 
    message: `Chef ${isFeatured ? 'featured' : 'removed from featured list'}`, 
    data: profile 
  });
});

module.exports = {
  getUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  getPendingRecipes,
  updateRecipeStatus,
  approveRecipe,
  rejectRecipe,
  flagRecipe,
  toggleChefFeatured,
  getAuditLogs,
  getStats,
  getUserStats,
  getRecipeStats
};
