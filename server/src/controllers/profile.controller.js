'use strict';

const { User } = require('../models/user.model');
const { Profile } = require('../models/profile.model');
const { Recipe } = require('../models/recipe.model');
const { Follow } = require('../models/social.model');
const { CloudinaryService } = require('../services/cloudinary.service');
const { validateData, updateProfileSchema, paginationSchema } = require('../validators');
const { getPaginationData } = require('../utils/helpers');
const { sendSuccess, errorResponses, sendPaginated } = require('../utils/response');
const { MESSAGES, HTTP_STATUS } = require('../constants');
const { asyncHandler } = require('../middlewares/error.middleware');

class ProfileController {
  /**
   * Get all chef profiles (public)
   */
  static getAllProfiles = asyncHandler(async (req, res) => {
    const paginationValidation = validateData(paginationSchema, req.query);
    const { page = 1, limit = 10 } = paginationValidation.success ? paginationValidation.data : {};
    const { q } = req.query;

    // Only get chef users (exclude admin and regular users)
    const userQuery = { role: 'chef' };
    if (q) {
      userQuery.$or = [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } },
      ];
    }

    const chefUsers = await User.find(userQuery).select('_id');
    const chefIds = chefUsers.map((u) => u._id);

    const profileQuery = { userId: { $in: chefIds } };
    const total = await Profile.countDocuments(profileQuery);
    const { skip } = getPaginationData(total, page, limit);

    const profiles = await Profile.find(profileQuery)
      .populate('userId', 'firstName lastName username email role followerCount followingCount recipeCount')
      .sort({ rating: -1 })
      .skip(skip)
      .limit(limit);

    // If authenticated, batch-check which chefs the user is following
    let profileData = profiles.map((p) => p.toObject());
    if (req.user) {
      const profileUserIds = profiles.map((p) => p.userId?._id || p.userId);
      const follows = await Follow.find({
        followerId: req.user.userId,
        followingId: { $in: profileUserIds },
      });
      const followedIds = new Set(follows.map((f) => f.followingId.toString()));

      profileData = profileData.map((p) => ({
        ...p,
        isFollowing: followedIds.has((p.userId?._id || p.userId).toString()),
      }));
    }

    const meta = getPaginationData(total, page, limit);

    return sendPaginated(res, HTTP_STATUS.OK, profileData, meta, MESSAGES.PROFILE_FETCHED);
  });

  /**
   * Get a specific chef profile
   */
  static getProfile = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return errorResponses.notFound(res, 'Chef not found');
    }

    const profile = await Profile.findOne({ userId }).populate('userId', 'firstName lastName username email role createdAt');
    if (!profile) {
      return errorResponses.notFound(res, MESSAGES.PROFILE_NOT_FOUND);
    }

    const [recipeCount, followerCount, followingCount] = await Promise.all([
      Recipe.countDocuments({ chefId: userId, status: 'published' }),
      Follow.countDocuments({ followingId: userId }),
      Follow.countDocuments({ followerId: userId }),
    ]);

    const profileData = {
      ...profile.toObject(),
      recipeCount,
      followerCount,
      followingCount,
    };

    return sendSuccess(res, HTTP_STATUS.OK, profileData, MESSAGES.PROFILE_FETCHED);
  });

  /**
   * Get current user's profile (authenticated)
   */
  static getCurrentProfile = asyncHandler(async (req, res) => {
    const profile = await Profile.findOne({ userId: req.user.userId }).populate(
      'userId',
      'firstName lastName username email role'
    );

    if (!profile) {
      return errorResponses.notFound(res, MESSAGES.PROFILE_NOT_FOUND);
    }

    const [recipeCount, followerCount, followingCount] = await Promise.all([
      Recipe.countDocuments({ chefId: req.user.userId }),
      Follow.countDocuments({ followingId: req.user.userId }),
      Follow.countDocuments({ followerId: req.user.userId }),
    ]);

    const profileData = {
      ...profile.toObject(),
      recipeCount,
      followerCount,
      followingCount,
    };

    return sendSuccess(res, HTTP_STATUS.OK, profileData, MESSAGES.PROFILE_FETCHED);
  });

  /**
   * Update current user's profile
   */
  static updateProfile = asyncHandler(async (req, res) => {
    const validation = validateData(updateProfileSchema, req.body);
    if (!validation.success) {
      return errorResponses.unprocessable(res, MESSAGES.VALIDATION_ERROR, validation.errors);
    }

    const { firstName, lastName, ...profileData } = validation.data;

    // Update user name fields if provided
    if (firstName || lastName) {
      const userUpdate = {};
      if (firstName) userUpdate.firstName = firstName;
      if (lastName) userUpdate.lastName = lastName;
      await User.findByIdAndUpdate(req.user.userId, userUpdate);
    }

    let profile = await Profile.findOne({ userId: req.user.userId });

    if (!profile) {
      profile = await Profile.create({
        userId: req.user.userId,
        ...profileData,
      });
    } else {
      Object.assign(profile, profileData);
      await profile.save();
    }

    await profile.populate('userId', 'firstName lastName username email');

    return sendSuccess(res, HTTP_STATUS.OK, profile, MESSAGES.PROFILE_UPDATED);
  });

  /**
   * Upload profile image
   */
  static uploadProfileImage = asyncHandler(async (req, res) => {
    const file = req.file || (req.files && req.files.image ? req.files.image[0] : null);
    if (!file) {
      return errorResponses.badRequest(res, 'No file provided');
    }

    let uploadResult;
    try {
      // Use optimized upload for profile images (800x800)
      uploadResult = await CloudinaryService.uploadOptimizedImage(
        file.buffer,
        'recipenest/profiles',
        `${req.user.userId}-profile`
      );
    } catch (error) {
      console.error(`[UPLOAD ERROR] Cloudinary profile image upload failed for user ${req.user.userId}:`, error.message);
      throw error;
    }

    let profile = await Profile.findOne({ userId: req.user.userId });

    if (!profile) {
      profile = await Profile.create({
        userId: req.user.userId,
        profileImage: uploadResult.secure_url,
      });
    } else {
      profile.profileImage = uploadResult.secure_url;
      await profile.save();
    }

    return sendSuccess(res, HTTP_STATUS.OK, { imageUrl: uploadResult.secure_url }, MESSAGES.PROFILE_IMAGE_UPDATED);
  });

  /**
   * Upload banner image
   */
  static uploadBannerImage = asyncHandler(async (req, res) => {
    const file = req.file || (req.files && req.files.banner ? req.files.banner[0] : null);
    if (!file) {
      return errorResponses.badRequest(res, 'No file provided');
    }

    let uploadResult;
    try {
      // Optimized upload for banners using the specialized service method
      uploadResult = await CloudinaryService.uploadBanner(
        file.buffer,
        'recipenest/banners',
        `${req.user.userId}-banner`
      );
    } catch (error) {
      console.error(`[UPLOAD ERROR] Cloudinary banner upload failed for user ${req.user.userId}:`, error.message);
      throw error;
    }

    let profile = await Profile.findOne({ userId: req.user.userId });

    if (!profile) {
      profile = await Profile.create({
        userId: req.user.userId,
        bannerImage: uploadResult.secure_url,
      });
    } else {
      profile.bannerImage = uploadResult.secure_url;
      await profile.save();
    }

    return sendSuccess(res, HTTP_STATUS.OK, { bannerUrl: uploadResult.secure_url }, 'Banner image updated successfully');
  });

  /**
   * Get chef statistics
   */
  static getChefStats = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return errorResponses.notFound(res, 'Chef not found');
    }

    const profile = await Profile.findOne({ userId });
    const recipes = await Recipe.find({ chefId: userId });

    const totalRecipes = recipes.length;
    const publishedRecipes = recipes.filter((r) => r.status === 'published').length;
    const totalLikes = recipes.reduce((sum, r) => sum + r.likes, 0);
    const totalComments = recipes.reduce((sum, r) => sum + r.comments, 0);
    const totalSaves = recipes.reduce((sum, r) => sum + r.saves, 0);
    const totalViews = recipes.reduce((sum, r) => sum + r.views, 0);

    const [followerCount, followingCount] = await Promise.all([
      Follow.countDocuments({ followingId: userId }),
      Follow.countDocuments({ followerId: userId }),
    ]);

    const stats = {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        verified: profile?.verified || false,
      },
      recipes: {
        total: totalRecipes,
        published: publishedRecipes,
        draft: totalRecipes - publishedRecipes,
      },
      engagement: {
        likes: totalLikes,
        comments: totalComments,
        saves: totalSaves,
        views: totalViews,
      },
      social: {
        followers: followerCount,
        following: followingCount,
      },
      profile: {
        bio: profile?.bio,
        speciality: profile?.speciality,
        experience: profile?.experience,
        rating: profile?.rating,
        profileImage: profile?.profileImage,
        bannerImage: profile?.bannerImage,
      },
    };

    return sendSuccess(res, HTTP_STATUS.OK, stats, 'Chef statistics retrieved successfully');
  });

  /**
   * Search chefs
   */
  static searchChefs = asyncHandler(async (req, res) => {
    const paginationValidation = validateData(paginationSchema, req.query);
    const { page = 1, limit = 10 } = paginationValidation.success ? paginationValidation.data : {};

    const { search, speciality } = req.query;
    const userQuery = {};

    if (search) {
      userQuery.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(userQuery).select('_id');
    const userIds = users.map((u) => u._id);

    const profileQuery = {};
    if (speciality) {
      profileQuery.speciality = { $regex: speciality, $options: 'i' };
    }
    if (userIds.length > 0) {
      profileQuery.userId = { $in: userIds };
    }

    const total = await Profile.countDocuments(profileQuery);
    const { skip } = getPaginationData(total, page, limit);

    const profiles = await Profile.find(profileQuery)
      .populate('userId', 'firstName lastName username')
      .sort({ rating: -1 })
      .skip(skip)
      .limit(limit);

    const meta = getPaginationData(total, page, limit);

    return sendPaginated(res, HTTP_STATUS.OK, profiles, meta, 'Chefs retrieved successfully');
  });
}

module.exports = { ProfileController };
