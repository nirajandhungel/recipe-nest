'use strict';

const { Recipe } = require('../models/recipe.model');
const { User } = require('../models/user.model');
const { Like, Comment, Save, Follow } = require('../models/social.model');
const { Profile } = require('../models/profile.model');
const { validateData, createCommentSchema, paginationSchema } = require('../validators');
const { getPaginationData } = require('../utils/helpers');
const { sendSuccess, errorResponses, sendPaginated } = require('../utils/response');
const { MESSAGES, HTTP_STATUS } = require('../constants');
const { asyncHandler } = require('../middlewares/error.middleware');

class SocialController {
  /**
   * Like a recipe
   */
  static likeRecipe = asyncHandler(async (req, res) => {
    const { recipeId } = req.params;

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return errorResponses.notFound(res, MESSAGES.RECIPE_NOT_FOUND);

    const existingLike = await Like.findOne({ userId: req.user.userId, recipeId });
    if (existingLike) return errorResponses.conflict(res, 'Recipe already liked');

    await Like.create({ userId: req.user.userId, recipeId });

    recipe.likes += 1;
    await recipe.save();

    await Profile.findOneAndUpdate({ userId: recipe.chefId }, { $inc: { totalLikes: 1 } });

    return sendSuccess(res, HTTP_STATUS.CREATED, null, MESSAGES.LIKED_RECIPE);
  });

  /**
   * Unlike a recipe
   */
  static unlikeRecipe = asyncHandler(async (req, res) => {
    const { recipeId } = req.params;

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return errorResponses.notFound(res, MESSAGES.RECIPE_NOT_FOUND);

    const like = await Like.findOneAndDelete({ userId: req.user.userId, recipeId });
    if (!like) return errorResponses.notFound(res, 'Like not found');

    recipe.likes = Math.max(0, recipe.likes - 1);
    await recipe.save();

    await Profile.findOneAndUpdate({ userId: recipe.chefId }, { $inc: { totalLikes: -1 } });

    return sendSuccess(res, HTTP_STATUS.OK, null, MESSAGES.UNLIKED_RECIPE);
  });

  /**
   * Check if user liked a recipe
   */
  static isRecipeLiked = asyncHandler(async (req, res) => {
    const { recipeId } = req.params;
    const like = await Like.findOne({ userId: req.user.userId, recipeId });
    return sendSuccess(res, HTTP_STATUS.OK, { liked: !!like });
  });

  /**
   * Add a comment to a recipe
   */
  static addComment = asyncHandler(async (req, res) => {
    const { recipeId } = req.params;

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return errorResponses.notFound(res, MESSAGES.RECIPE_NOT_FOUND);

    const validation = validateData(createCommentSchema, req.body);
    if (!validation.success) {
      return errorResponses.unprocessable(res, MESSAGES.VALIDATION_ERROR, validation.errors);
    }

    const { text, rating } = validation.data;

    const comment = await Comment.create({
      userId: req.user.userId,
      recipeId,
      text,
      ...(rating && { rating }),
    });

    recipe.comments += 1;
    await recipe.save();

    await Profile.findOneAndUpdate({ userId: recipe.chefId }, { $inc: { totalComments: 1 } });
    await comment.populate('userId', 'firstName lastName username');

    // Return both text and content for client compatibility
    const commentObj = comment.toObject();
    commentObj.content = commentObj.text;

    return sendSuccess(res, HTTP_STATUS.CREATED, { comment: commentObj }, MESSAGES.COMMENT_ADDED);
  });

  /**
   * Get recipe comments with pagination
   */
  static getComments = asyncHandler(async (req, res) => {
    const { recipeId } = req.params;
    const paginationValidation = validateData(paginationSchema, req.query);
    const { page = 1, limit = 10 } = paginationValidation.success ? paginationValidation.data : {};

    const recipeExists = await Recipe.findById(recipeId);
    if (!recipeExists) return errorResponses.notFound(res, MESSAGES.RECIPE_NOT_FOUND);

    const total = await Comment.countDocuments({ recipeId });
    const { skip } = getPaginationData(total, page, limit);

    const comments = await Comment.find({ recipeId })
      .populate('userId', 'firstName lastName username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const meta = getPaginationData(total, page, limit);

    return sendPaginated(res, HTTP_STATUS.OK, comments, meta, 'Comments retrieved successfully');
  });

  /**
   * Delete a comment
   */
  static deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) return errorResponses.notFound(res, 'Comment not found');

    if (comment.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return errorResponses.forbidden(res);
    }

    await Comment.findByIdAndDelete(commentId);

    const recipe = await Recipe.findByIdAndUpdate(comment.recipeId, { $inc: { comments: -1 } });

    if (recipe) {
      await Profile.findOneAndUpdate({ userId: recipe.chefId }, { $inc: { totalComments: -1 } });
    }

    return sendSuccess(res, HTTP_STATUS.OK, null, MESSAGES.COMMENT_DELETED);
  });

  /**
   * Save a recipe
   */
  static saveRecipe = asyncHandler(async (req, res) => {
    const { recipeId } = req.params;

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return errorResponses.notFound(res, MESSAGES.RECIPE_NOT_FOUND);

    const existingSave = await Save.findOne({ userId: req.user.userId, recipeId });
    if (existingSave) return errorResponses.conflict(res, 'Recipe already saved');

    await Save.create({ userId: req.user.userId, recipeId });

    recipe.saves += 1;
    await recipe.save();

    await Profile.findOneAndUpdate({ userId: recipe.chefId }, { $inc: { totalSaves: 1 } });

    return sendSuccess(res, HTTP_STATUS.CREATED, null, MESSAGES.RECIPE_SAVED);
  });

  /**
   * Unsave a recipe
   */
  static unsaveRecipe = asyncHandler(async (req, res) => {
    const { recipeId } = req.params;

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return errorResponses.notFound(res, MESSAGES.RECIPE_NOT_FOUND);

    const save = await Save.findOneAndDelete({ userId: req.user.userId, recipeId });
    if (!save) return errorResponses.notFound(res, 'Save not found');

    recipe.saves = Math.max(0, recipe.saves - 1);
    await recipe.save();

    await Profile.findOneAndUpdate({ userId: recipe.chefId }, { $inc: { totalSaves: -1 } });

    return sendSuccess(res, HTTP_STATUS.OK, null, MESSAGES.RECIPE_UNSAVED);
  });

  /**
   * Follow a chef
   */
  static followChef = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (userId === req.user.userId) {
      return errorResponses.badRequest(res, 'Cannot follow yourself');
    }

    const chef = await User.findById(userId);
    if (!chef) return errorResponses.notFound(res, 'Chef not found');

    const existingFollow = await Follow.findOne({ followerId: req.user.userId, followingId: userId });
    if (existingFollow) return errorResponses.conflict(res, 'Already following this chef');

    await Follow.create({ followerId: req.user.userId, followingId: userId });

    await Promise.all([
      User.findByIdAndUpdate(req.user.userId, { $inc: { followingCount: 1 } }),
      User.findByIdAndUpdate(userId, { $inc: { followerCount: 1 } }),
    ]);

    return sendSuccess(res, HTTP_STATUS.CREATED, null, MESSAGES.FOLLOWED_USER);
  });

  /**
   * Unfollow a chef
   */
  static unfollowChef = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const chef = await User.findById(userId);
    if (!chef) return errorResponses.notFound(res, 'Chef not found');

    const follow = await Follow.findOneAndDelete({ followerId: req.user.userId, followingId: userId });
    if (!follow) return errorResponses.notFound(res, 'Not following this chef');

    await Promise.all([
      User.findByIdAndUpdate(req.user.userId, { $inc: { followingCount: -1 } }),
      User.findByIdAndUpdate(userId, { $inc: { followerCount: -1 } }),
    ]);

    return sendSuccess(res, HTTP_STATUS.OK, null, MESSAGES.UNFOLLOWED_USER);
  });

  /**
   * Get chef followers with pagination
   */
  static getFollowers = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const paginationValidation = validateData(paginationSchema, req.query);
    const { page = 1, limit = 10 } = paginationValidation.success ? paginationValidation.data : {};

    const chef = await User.findById(userId);
    if (!chef) return errorResponses.notFound(res, 'Chef not found');

    const total = await Follow.countDocuments({ followingId: userId });
    const { skip } = getPaginationData(total, page, limit);

    const followers = await Follow.find({ followingId: userId })
      .populate('followerId', 'firstName lastName username')
      .skip(skip)
      .limit(limit);

    const meta = getPaginationData(total, page, limit);

    return sendPaginated(res, HTTP_STATUS.OK, followers, meta, 'Followers retrieved successfully');
  });

  /**
   * Get chef following with pagination
   */
  static getFollowing = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const paginationValidation = validateData(paginationSchema, req.query);
    const { page = 1, limit = 10 } = paginationValidation.success ? paginationValidation.data : {};

    const chef = await User.findById(userId);
    if (!chef) return errorResponses.notFound(res, 'Chef not found');

    const total = await Follow.countDocuments({ followerId: userId });
    const { skip } = getPaginationData(total, page, limit);

    const following = await Follow.find({ followerId: userId })
      .populate('followingId', 'firstName lastName username')
      .skip(skip)
      .limit(limit);

    const meta = getPaginationData(total, page, limit);

    return sendPaginated(res, HTTP_STATUS.OK, following, meta, 'Following retrieved successfully');
  });

  /**
   * Get user's saved recipes
   */
  static getSavedRecipes = asyncHandler(async (req, res) => {
    const paginationValidation = validateData(paginationSchema, req.query);
    const { page = 1, limit = 10 } = paginationValidation.success ? paginationValidation.data : {};

    const total = await Save.countDocuments({ userId: req.user.userId });
    const { skip } = getPaginationData(total, page, limit);

    const saves = await Save.find({ userId: req.user.userId })
      .populate('recipeId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const recipes = saves.map((s) => s.recipeId);
    const meta = getPaginationData(total, page, limit);

    return sendPaginated(res, HTTP_STATUS.OK, recipes, meta, 'Saved recipes retrieved successfully');
  });
}

module.exports = { SocialController };
