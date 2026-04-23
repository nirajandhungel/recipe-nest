'use strict';

const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { apiLimiter } = require('../middlewares/ratelimit.middleware');
const { Recipe } = require('../models/recipe.model');
const { Like, Comment, Save, Follow, View } = require('../models/social.model');
const { User } = require('../models/user.model');
const { buildProfileImageMap, attachProfileImage } = require('../utils/profile-image');

const router = Router();

// ═══════════════════════════════════════════════════════════
// Chef analytics — recipe performance
// ═══════════════════════════════════════════════════════════
router.get('/chef/recipes', apiLimiter, authenticate, async (req, res) => {
  try {
    const recipes = await Recipe.find({ chefId: req.user.userId })
      .select('title views likes saves comments rating status createdAt imageUrl')
      .sort({ createdAt: -1 });

    const totalViews = recipes.reduce((s, r) => s + (r.views || 0), 0);
    const totalLikes = recipes.reduce((s, r) => s + (r.likes || 0), 0);
    const totalSaves = recipes.reduce((s, r) => s + (r.saves || 0), 0);
    const totalComments = recipes.reduce((s, r) => s + (r.comments || 0), 0);
    const published = recipes.filter((r) => r.status === 'published').length;
    const draft = recipes.filter((r) => r.status === 'draft').length;

    res.json({
      success: true,
      data: {
        recipes,
        totalViews,
        totalLikes,
        totalSaves,
        totalComments,
        totalRecipes: recipes.length,
        published,
        draft,
      },
    });
  } catch (err) {
    console.error('Chef recipes analytics error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════
// Chef analytics — engagement breakdown
// ═══════════════════════════════════════════════════════════
router.get('/chef/engagement', apiLimiter, authenticate, async (req, res) => {
  try {
    const recipes = await Recipe.find({ chefId: req.user.userId }).select('_id title');
    const recipeIds = recipes.map((r) => r._id);

    const [totalLikes, totalSaves, totalComments, totalViews] = await Promise.all([
      Like.countDocuments({ recipeId: { $in: recipeIds } }),
      Save.countDocuments({ recipeId: { $in: recipeIds } }),
      Comment.countDocuments({ recipeId: { $in: recipeIds } }),
      View.countDocuments({ recipeId: { $in: recipeIds } }),
    ]);

    // Recent likes with user info
    const recentLikes = await Like.find({ recipeId: { $in: recipeIds } })
      .populate('userId', 'firstName lastName username')
      .populate('recipeId', 'title')
      .sort({ createdAt: -1 })
      .limit(10);

    // Recent saves with user info
    const recentSaves = await Save.find({ recipeId: { $in: recipeIds } })
      .populate('userId', 'firstName lastName username')
      .populate('recipeId', 'title')
      .sort({ createdAt: -1 })
      .limit(10);

    // Recent comments
    const recentComments = await Comment.find({ recipeId: { $in: recipeIds } })
      .populate('userId', 'firstName lastName username')
      .populate('recipeId', 'title')
      .sort({ createdAt: -1 })
      .limit(10);
    const engagementUsers = [
      ...recentLikes.map((like) => like.userId?._id),
      ...recentSaves.map((save) => save.userId?._id),
      ...recentComments.map((comment) => comment.userId?._id),
    ];
    const engagementImageMap = await buildProfileImageMap(engagementUsers);
    recentLikes.forEach((like) => attachProfileImage(like.userId, engagementImageMap));
    recentSaves.forEach((save) => attachProfileImage(save.userId, engagementImageMap));
    recentComments.forEach((comment) => attachProfileImage(comment.userId, engagementImageMap));

    // Follower count
    const [followerCount, followingCount] = await Promise.all([
      Follow.countDocuments({ followingId: req.user.userId }),
      Follow.countDocuments({ followerId: req.user.userId }),
    ]);

    // Engagement timeline (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const timeline = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const [dayLikes, dayViews, daySaves] = await Promise.all([
        Like.countDocuments({ recipeId: { $in: recipeIds }, createdAt: { $gte: dayStart, $lte: dayEnd } }),
        View.countDocuments({ recipeId: { $in: recipeIds }, createdAt: { $gte: dayStart, $lte: dayEnd } }),
        Save.countDocuments({ recipeId: { $in: recipeIds }, createdAt: { $gte: dayStart, $lte: dayEnd } }),
      ]);

      timeline.push({
        date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        likes: dayLikes,
        views: dayViews,
        saves: daySaves,
      });
    }

    // Top performing recipes (by combined score)
    const topRecipes = await Recipe.find({ chefId: req.user.userId, status: 'published' })
      .select('title views likes saves comments imageUrl')
      .sort({ likes: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        totalLikes,
        totalSaves,
        totalComments,
        totalViews,
        followerCount,
        followingCount,
        recentLikes: recentLikes.map((l) => ({
          user: l.userId,
          recipe: l.recipeId,
          date: l.createdAt,
        })),
        recentSaves: recentSaves.map((s) => ({
          user: s.userId,
          recipe: s.recipeId,
          date: s.createdAt,
        })),
        recentComments: recentComments.map((c) => ({
          user: c.userId,
          recipe: c.recipeId,
          text: c.text,
          rating: c.rating,
          date: c.createdAt,
        })),
        topRecipes,
        timeline,
      },
    });
  } catch (err) {
    console.error('Chef engagement analytics error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Chef followers analytics
router.get('/chef/followers', apiLimiter, authenticate, async (req, res) => {
  try {
    const followers = await Follow.find({ followingId: req.user.userId })
      .populate('followerId', 'firstName lastName username')
      .sort({ createdAt: -1 })
      .limit(20);
    const followerImageMap = await buildProfileImageMap(followers.map((follow) => follow.followerId?._id));
    followers.forEach((follow) => attachProfileImage(follow.followerId, followerImageMap));

    const followerCount = await Follow.countDocuments({ followingId: req.user.userId });

    res.json({
      success: true,
      data: {
        followers: followers.map((f) => ({
          user: f.followerId,
          followedAt: f.createdAt,
        })),
        total: followerCount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Recipe-specific views
router.get('/recipe/:recipeId/views', apiLimiter, authenticate, async (req, res) => {
  try {
    const { recipeId } = req.params;
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });

    const totalViews = await View.countDocuments({ recipeId });
    res.json({ success: true, data: { totalViews } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Recipe-specific engagement
router.get('/recipe/:recipeId/engagement', apiLimiter, authenticate, async (req, res) => {
  try {
    const { recipeId } = req.params;
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });

    const [likes, saves, comments, views] = await Promise.all([
      Like.countDocuments({ recipeId }),
      Save.countDocuments({ recipeId }),
      Comment.countDocuments({ recipeId }),
      View.countDocuments({ recipeId }),
    ]);

    // Who liked it
    const likedBy = await Like.find({ recipeId })
      .populate('userId', 'firstName lastName username')
      .sort({ createdAt: -1 })
      .limit(20);

    // Who saved it
    const savedBy = await Save.find({ recipeId })
      .populate('userId', 'firstName lastName username')
      .sort({ createdAt: -1 })
      .limit(20);
    const activityImageMap = await buildProfileImageMap([
      ...likedBy.map((like) => like.userId?._id),
      ...savedBy.map((save) => save.userId?._id),
    ]);
    likedBy.forEach((like) => attachProfileImage(like.userId, activityImageMap));
    savedBy.forEach((save) => attachProfileImage(save.userId, activityImageMap));

    res.json({
      success: true,
      data: {
        likes,
        saves,
        comments,
        views,
        likedBy: likedBy.map((l) => ({ user: l.userId, date: l.createdAt })),
        savedBy: savedBy.map((s) => ({ user: s.userId, date: s.createdAt })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// User activity analytics
router.get('/user/activity', apiLimiter, authenticate, async (req, res) => {
  try {
    const [likesGiven, savesMade, commentsWritten, following] = await Promise.all([
      Like.countDocuments({ userId: req.user.userId }),
      Save.countDocuments({ userId: req.user.userId }),
      Comment.countDocuments({ userId: req.user.userId }),
      Follow.countDocuments({ followerId: req.user.userId }),
    ]);

    res.json({
      success: true,
      data: { likesGiven, savesMade, commentsWritten, following },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
