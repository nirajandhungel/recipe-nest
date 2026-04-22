'use strict';

const { Recipe } = require('../models/recipe.model');
const { User } = require('../models/user.model');
const { Like, Comment, Save, View } = require('../models/social.model');
const { CloudinaryService } = require('../services/cloudinary.service');
const { AuditService } = require('../services/audit.service');
const {
  validateData,
  createRecipeSchema,
  updateRecipeSchema,
  paginationSchema,
} = require('../validators');
const { getPaginationData } = require('../utils/helpers');
const { sendSuccess, errorResponses, sendPaginated } = require('../utils/response');
const { MESSAGES, HTTP_STATUS, AUDIT_ACTIONS } = require('../constants');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * FormData sends everything as strings, but the Zod schema expects
 * real arrays and numbers. Normalise the raw body before validating.
 */
const normaliseRecipeBody = (body) => {
  const out = { ...body };

  // Parse JSON-encoded arrays
  ['ingredients', 'steps', 'tags'].forEach((key) => {
    if (typeof out[key] === 'string') {
      try { out[key] = JSON.parse(out[key]); } catch { /* leave as-is */ }
    }
  });

  // Cast numeric fields
  ['prepTimeMinutes', 'cookTimeMinutes', 'servings'].forEach((key) => {
    if (out[key] !== undefined) out[key] = Number(out[key]);
  });

  // Cast nested numeric fields inside ingredients and filter out empty ones
  if (Array.isArray(out.ingredients)) {
    out.ingredients = out.ingredients
      .filter((ing) => ing.name?.trim() && ing.unit?.trim())
      .map((ing) => ({
        ...ing,
        quantity: Number(ing.quantity || 0),
      }));
  }

  // Cast stepNumber inside steps and filter out empty ones
  if (Array.isArray(out.steps)) {
    out.steps = out.steps
      .filter((step) => step.instruction && step.instruction.trim() !== '')
      .map((step, i) => ({
        ...step,
        stepNumber: Number(step.stepNumber ?? i + 1),
      }));
  }

  return out;
};

class RecipeController {
  /**
   * Create a new recipe (Chefs only)
   */
  static createRecipe = asyncHandler(async (req, res) => {
    const normalisedBody = normaliseRecipeBody(req.body);
    const validation = validateData(createRecipeSchema, normalisedBody);
    
    if (!validation.success) {
      return errorResponses.unprocessable(res, MESSAGES.VALIDATION_ERROR, validation.errors);
    }

    const { title, description, ingredients, steps, ...rest } = validation.data;

    let imageUrl;
    if (req.file) {
      const uploadResult = await CloudinaryService.uploadImage(
        req.file.buffer,
        'recipenest/recipes',
        `${req.user.userId}-${Date.now()}`
      );
      imageUrl = uploadResult.secure_url;
    }

    // Explicitly set chefId from the authenticated user
    const recipe = await Recipe.create({
      title,
      description,
      ingredients,
      steps,
      ...rest,
      chefId: req.user.userId, // Ensure this is AFTER ...rest just in case
      imageUrl,
    });

    await User.findByIdAndUpdate(req.user.userId, { $inc: { recipeCount: 1 } });

    await AuditService.log({
      adminId: req.user.userId,
      action: AUDIT_ACTIONS.RECIPE_CREATED,
      targetType: 'recipe',
      targetId: recipe._id,
    });

    return sendSuccess(res, HTTP_STATUS.CREATED, recipe, MESSAGES.RECIPE_CREATED);
  });

  /**
   * Get all recipes with filters and pagination
   */
  static getRecipes = asyncHandler(async (req, res) => {
    const paginationValidation = validateData(paginationSchema, req.query);
    const { page = 1, limit = 10 } = paginationValidation.success ? paginationValidation.data : {};

    const query = {};
    const { chefId } = req.query;

    // By default, only show published recipes. 
    // BUT if a chef is viewing their own recipes (chefId query matches their ID), let them see drafts.
    if (chefId && chefId === req.user?.userId) {
      query.chefId = chefId;
    } else if (req.user?.role === 'admin' && chefId) {
      query.chefId = chefId;
    } else {
      query.isPublished = true;
      query.status = 'published';
      if (chefId) query.chefId = chefId;
    }

    if (req.query.cuisineType || req.query.cuisine) query.cuisineType = req.query.cuisineType || req.query.cuisine;
    if (req.query.difficulty) query.difficulty = req.query.difficulty;
    if (req.query.mealType) query.mealType = req.query.mealType;
    const searchTerm = req.query.search || req.query.q;
    if (searchTerm) {
      query.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { tags: { $in: [new RegExp(searchTerm, 'i')] } },
      ];
    }
    const total = await Recipe.countDocuments(query);
    const { skip } = getPaginationData(total, page, limit);

    const recipes = await Recipe.find(query)
      .populate('chefId', 'firstName lastName username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const meta = getPaginationData(total, page, limit);

    return sendPaginated(res, HTTP_STATUS.OK, recipes, meta, MESSAGES.RECIPES_FETCHED);
  });

  /**
   * Get a single recipe
   */
  static getRecipe = asyncHandler(async (req, res) => {
    const recipe = await Recipe.findById(req.params.id).populate('chefId', 'firstName lastName username');

    if (!recipe) {
      return errorResponses.notFound(res, MESSAGES.RECIPE_NOT_FOUND);
    }

    // Visibility check: only owner, admin, or published recipes can be viewed
    const isOwner = req.user?.userId === recipe.chefId._id.toString();
    const isAdmin = req.user?.role === 'admin';
    const isPubliclyViewable = recipe.status === 'published';

    if (!isOwner && !isAdmin && !isPubliclyViewable) {
      return errorResponses.forbidden(res, 'This recipe is pending moderation and is not publicly visible.');
    }

    await View.create({
      recipeId: recipe._id,
      userId: req.user?.userId,
    });

    recipe.views += 1;
    await recipe.save();

    return sendSuccess(res, HTTP_STATUS.OK, recipe, MESSAGES.RECIPE_FETCHED);
  });

  /**
   * Update recipe (Chef owner only)
   */
  static updateRecipe = asyncHandler(async (req, res) => {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return errorResponses.notFound(res, MESSAGES.RECIPE_NOT_FOUND);
    }

    if (recipe.chefId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return errorResponses.forbidden(res, MESSAGES.RECIPE_FORBIDDEN);
    }

    const validation = validateData(updateRecipeSchema, normaliseRecipeBody(req.body));
    if (!validation.success) {
      return errorResponses.unprocessable(res, MESSAGES.VALIDATION_ERROR, validation.errors);
    }

    if (req.file) {
      if (recipe.imageUrl) {
        await CloudinaryService.deleteImage(recipe.imageUrl);
      }
      const uploadResult = await CloudinaryService.uploadImage(
        req.file.buffer,
        'recipenest/recipes',
        `${req.user.userId}-${Date.now()}`
      );
      recipe.imageUrl = uploadResult.secure_url;
    }

    Object.assign(recipe, validation.data);
    await recipe.save();

    await AuditService.log({
      adminId: req.user.userId,
      action: AUDIT_ACTIONS.RECIPE_UPDATED,
      targetType: 'recipe',
      targetId: recipe._id,
    });

    return sendSuccess(res, HTTP_STATUS.OK, recipe, MESSAGES.RECIPE_UPDATED);
  });

  /**
   * Delete recipe (Chef owner only)
   */
  static deleteRecipe = asyncHandler(async (req, res) => {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return errorResponses.notFound(res, MESSAGES.RECIPE_NOT_FOUND);
    }

    if (recipe.chefId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return errorResponses.forbidden(res, MESSAGES.RECIPE_FORBIDDEN);
    }

    if (recipe.imageUrl) {
      await CloudinaryService.deleteImage(recipe.imageUrl);
    }

    await Promise.all([
      Like.deleteMany({ recipeId: recipe._id }),
      Comment.deleteMany({ recipeId: recipe._id }),
      Save.deleteMany({ recipeId: recipe._id }),
      View.deleteMany({ recipeId: recipe._id }),
    ]);

    await Recipe.findByIdAndDelete(req.params.id);
    await User.findByIdAndUpdate(recipe.chefId, { $inc: { recipeCount: -1 } });

    await AuditService.log({
      adminId: req.user.userId,
      action: AUDIT_ACTIONS.RECIPE_DELETED,
      targetType: 'recipe',
      targetId: recipe._id,
    });

    return sendSuccess(res, HTTP_STATUS.OK, null, MESSAGES.RECIPE_DELETED);
  });

  /**
   * Publish recipe
   */
  static publishRecipe = asyncHandler(async (req, res) => {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return errorResponses.notFound(res, MESSAGES.RECIPE_NOT_FOUND);
    }

    if (recipe.chefId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return errorResponses.forbidden(res, MESSAGES.RECIPE_FORBIDDEN);
    }

    recipe.status = 'pending';
    recipe.isPublished = true;
    await recipe.save();

    await AuditService.log({
      adminId: req.user.userId,
      action: AUDIT_ACTIONS.RECIPE_PUBLISHED,
      targetType: 'recipe',
      targetId: recipe._id,
    });

    return sendSuccess(res, HTTP_STATUS.OK, recipe, MESSAGES.RECIPE_PUBLISHED);
  });

  /**
   * Get chef's recipes
   */
  static getChefRecipes = asyncHandler(async (req, res) => {
    const paginationValidation = validateData(paginationSchema, req.query);
    const { page = 1, limit = 10 } = paginationValidation.success ? paginationValidation.data : {};

    const { chefId } = req.params;
    const query = { chefId };

    if (chefId !== req.user?.userId && req.user?.role !== 'admin') {
      query.status = 'published';
    }

    const total = await Recipe.countDocuments(query);
    const { skip } = getPaginationData(total, page, limit);

    const recipes = await Recipe.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);

    const meta = getPaginationData(total, page, limit);

    return sendPaginated(res, HTTP_STATUS.OK, recipes, meta, MESSAGES.RECIPES_FETCHED);
  });
}

module.exports = { RecipeController };