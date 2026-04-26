'use strict';

const { User } = require('../models/user.model');
const { Recipe } = require('../models/recipe.model');
const { Profile } = require('../models/profile.model');
const { AuditLog } = require('../models/auditlog.model');
const { AuditService } = require('../services/audit.service');
const { AUDIT_ACTIONS } = require('../constants');
const { asyncHandler } = require('../middlewares/error.middleware');
const { getPaginationData } = require('../utils/helpers');
const { buildProfileImageMap, attachProfileImage } = require('../utils/profile-image');

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
  const profiles = await Profile.find({ userId: { $in: userIds } }).select('userId isFeatured profileImage');
  
  const usersWithProfile = users.map(u => ({
    ...u,
    isFeatured: profiles.find(p => p.userId.toString() === u._id.toString())?.isFeatured || false,
    profileImage: profiles.find(p => p.userId.toString() === u._id.toString())?.profileImage || null
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

  const action = status === 'suspended' ? AUDIT_ACTIONS.USER_SUSPENDED : AUDIT_ACTIONS.USER_UPDATED;
  await AuditService.log({
    adminId: req.user.userId,
    action,
    targetType: 'user',
    targetId: userId,
    changes: { status },
    ipAddress: req.ip,
  });

  res.json({ success: true, message: `User status updated to ${status}`, data: user });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  await Profile.deleteOne({ userId: user._id });
  await Recipe.deleteMany({ chefId: user._id });

  await AuditService.log({
    adminId: req.user.userId,
    action: AUDIT_ACTIONS.USER_DELETED,
    targetType: 'user',
    targetId: req.params.userId,
    changes: { email: user.email, username: user.username },
    ipAddress: req.ip,
  });

  res.json({ success: true, message: 'User and all related data deleted' });
});

// Recipe Moderation
const getPendingRecipes = asyncHandler(async (req, res) => {
  const recipes = await Recipe.find({ status: 'pending' })
    .populate('chefId', 'firstName lastName username')
    .sort({ updatedAt: -1 });
  const chefImageMap = await buildProfileImageMap(recipes.map((recipe) => recipe.chefId?._id));
  recipes.forEach((recipe) => {
    attachProfileImage(recipe.chefId, chefImageMap);
  });
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

  await AuditService.log({
    adminId: req.user.userId,
    action: AUDIT_ACTIONS.RECIPE_PUBLISHED,
    targetType: 'recipe',
    targetId: recipeId,
    changes: { status: 'published' },
    ipAddress: req.ip,
  });

  res.json({ success: true, message: 'Recipe approved and published', data: recipe });
});

const rejectRecipe = asyncHandler(async (req, res) => {
  const { recipeId } = req.params;
  const { reason = '' } = req.body;

  const recipe = await Recipe.findByIdAndUpdate(recipeId, {
    status: 'rejected',
    isPublished: false,
    rejectionReason: reason
  }, { new: true });

  if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });

  await AuditService.log({
    adminId: req.user.userId,
    action: AUDIT_ACTIONS.RECIPE_FLAGGED,
    targetType: 'recipe',
    targetId: recipeId,
    reason,
    changes: { status: 'rejected' },
    ipAddress: req.ip,
  });

  res.json({ success: true, message: 'Recipe rejected', data: recipe });
});

const flagRecipe = asyncHandler(async (req, res) => {
  const { recipeId } = req.params;
  const recipe = await Recipe.findByIdAndUpdate(recipeId, {
    status: 'flagged',
  }, { new: true });

  if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });

  await AuditService.log({
    adminId: req.user.userId,
    action: AUDIT_ACTIONS.RECIPE_FLAGGED,
    targetType: 'recipe',
    targetId: recipeId,
    changes: { status: 'flagged' },
    ipAddress: req.ip,
  });

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
  const limit = parseInt(req.query.limit, 10) || 20;

  const total = await AuditLog.countDocuments();
  const totalPages = Math.ceil(total / limit) || 1;
  const skip = (page - 1) * limit;

  const logs = await AuditLog.find()
    .populate('adminId', 'firstName lastName username email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Map adminId to userId field for frontend compatibility
  const mappedLogs = logs.map(log => ({
    ...log,
    userId: log.adminId, // Frontend reads log.userId
  }));

  res.json({
    success: true,
    data: {
      logs: mappedLogs,
      totalPages,
      total,
    }
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

  await AuditService.log({
    adminId: req.user.userId,
    action: AUDIT_ACTIONS.ADMIN_ACTION,
    targetType: 'user',
    targetId: userId,
    changes: { isFeatured },
    ipAddress: req.ip,
  });

  res.json({ 
    success: true, 
    message: `Chef ${isFeatured ? 'featured' : 'removed from featured list'}`, 
    data: profile 
  });
});

const exportAuditLogs = asyncHandler(async (req, res) => {
  const { AuditService: AuditSvc } = require('../services/audit.service');
  const csv = await AuditSvc.exportLogs();

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
  res.send(csv);
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
  exportAuditLogs,
  getStats,
  getUserStats,
  getRecipeStats
};
