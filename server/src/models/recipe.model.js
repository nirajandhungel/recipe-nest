'use strict';

const mongoose = require('mongoose');
const { CUISINE_TYPES, DIFFICULTY_LEVELS, MEAL_TYPES, RECIPE_STATUSES } = require('../constants');

const ingredientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Ingredient name is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.1, 'Quantity must be greater than 0'],
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true,
    },
  },
  { _id: false }
);

const recipeStepSchema = new mongoose.Schema(
  {
    stepNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    instruction: {
      type: String,
      required: [true, 'Instruction is required'],
      trim: true,
      maxlength: [1000, 'Instruction cannot exceed 1000 characters'],
    },
    imageUrl: {
      type: String,
    },
  },
  { _id: false }
);

const recipeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Recipe title is required'],
      trim: true,
      minlength: [5, 'Recipe title must be at least 5 characters'],
      maxlength: [200, 'Recipe title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Recipe description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    chefId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Chef ID is required'],
    },
    ingredients: {
      type: [ingredientSchema],
      required: [true, 'At least one ingredient is required'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Recipe must have at least one ingredient',
      },
    },
    steps: {
      type: [recipeStepSchema],
      required: [true, 'At least one step is required'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Recipe must have at least one step',
      },
    },
    cuisineType: {
      type: String,
      enum: CUISINE_TYPES,
      required: [true, 'Cuisine type is required'],
    },
    difficulty: {
      type: String,
      enum: DIFFICULTY_LEVELS,
      required: [true, 'Difficulty level is required'],
    },
    mealType: {
      type: String,
      enum: MEAL_TYPES,
      required: [true, 'Meal type is required'],
    },
    prepTimeMinutes: {
      type: Number,
      required: [true, 'Prep time is required'],
      min: [0, 'Prep time cannot be negative'],
      max: [480, 'Prep time cannot exceed 8 hours'],
    },
    cookTimeMinutes: {
      type: Number,
      required: [true, 'Cook time is required'],
      min: [0, 'Cook time cannot be negative'],
      max: [480, 'Cook time cannot exceed 8 hours'],
    },
    servings: {
      type: Number,
      required: [true, 'Servings is required'],
      min: [1, 'Servings must be at least 1'],
      max: [100, 'Servings cannot exceed 100'],
    },
    tags: {
      type: [String],
      default: [],
    },
    imageUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: RECIPE_STATUSES,
      default: 'draft',
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    comments: {
      type: Number,
      default: 0,
      min: 0,
    },
    saves: {
      type: Number,
      default: 0,
      min: 0,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
recipeSchema.index({ chefId: 1 });
recipeSchema.index({ status: 1 });
recipeSchema.index({ cuisineType: 1 });
recipeSchema.index({ difficulty: 1 });
recipeSchema.index({ mealType: 1 });
recipeSchema.index({ createdAt: -1 });
recipeSchema.index({ likes: -1 });
recipeSchema.index({ rating: -1 });
recipeSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Compound indexes
recipeSchema.index({ chefId: 1, status: 1 });
recipeSchema.index({ chefId: 1, createdAt: -1 });

const Recipe = mongoose.model('Recipe', recipeSchema, 'recipes');

module.exports = { Recipe };
