'use strict';

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  INTERNAL_SERVER_ERROR: 500,
};

const MESSAGES = {
  // Auth
  REGISTER_SUCCESS: 'Account created successfully.',
  LOGIN_SUCCESS: 'Logged in successfully.',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  EMAIL_TAKEN: 'An account with this email already exists.',
  USERNAME_TAKEN: 'This username is already taken.',
  UNAUTHORIZED: 'Authentication required. Please log in.',
  TOKEN_INVALID: 'Invalid or expired token.',
  PASSWORD_RESET_SENT: 'Password reset link sent to your email.',
  PASSWORD_RESET_SUCCESS: 'Password reset successfully.',

  // Profile
  PROFILE_FETCHED: 'Profile retrieved successfully.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  PROFILE_NOT_FOUND: 'Chef profile not found.',
  PROFILE_IMAGE_UPDATED: 'Profile image updated successfully.',

  // Recipe
  RECIPE_CREATED: 'Recipe created successfully.',
  RECIPE_UPDATED: 'Recipe updated successfully.',
  RECIPE_DELETED: 'Recipe deleted successfully.',
  RECIPE_FETCHED: 'Recipe retrieved successfully.',
  RECIPES_FETCHED: 'Recipes retrieved successfully.',
  RECIPE_NOT_FOUND: 'Recipe not found.',
  RECIPE_FORBIDDEN: 'You are not authorized to modify this recipe.',
  RECIPE_PUBLISHED: 'Recipe published successfully.',

  // Social
  LIKED_RECIPE: 'Recipe liked successfully.',
  UNLIKED_RECIPE: 'Like removed successfully.',
  COMMENT_ADDED: 'Comment added successfully.',
  COMMENT_DELETED: 'Comment deleted successfully.',
  RECIPE_SAVED: 'Recipe saved successfully.',
  RECIPE_UNSAVED: 'Recipe removed from saves.',
  FOLLOWED_USER: 'User followed successfully.',
  UNFOLLOWED_USER: 'User unfollowed successfully.',

  // Chef Directory
  CHEFS_FETCHED: 'Chef directory retrieved successfully.',
  CHEF_NOT_FOUND: 'Chef not found.',

  // Admin
  USER_SUSPENDED: 'User suspended successfully.',
  USER_ACTIVATED: 'User activated successfully.',
  RECIPE_FLAGGED: 'Recipe flagged for review.',
  RECIPE_APPROVED: 'Recipe approved.',
  RECIPE_REJECTED: 'Recipe rejected.',

  // Dashboard
  DASHBOARD_FETCHED: 'Dashboard data retrieved successfully.',

  // Generic
  INTERNAL_ERROR: 'An unexpected error occurred. Please try again later.',
  VALIDATION_ERROR: 'Validation failed. Please check your input.',
  NOT_FOUND: 'The requested resource was not found.',
  FILE_TOO_LARGE: 'File size exceeds the allowed limit.',
  INVALID_FILE_TYPE: 'Only image files (jpg, jpeg, png, gif, webp) are allowed.',
  UPLOAD_ERROR: 'File upload failed. Please try again.',
};

const CUISINE_TYPES = [
  'Italian',
  'Chinese',
  'Indian',
  'Mexican',
  'Japanese',
  'French',
  'American',
  'Mediterranean',
  'Thai',
  'Other',
];

const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'];

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Beverage'];

const RECIPE_STATUSES = ['draft', 'pending', 'published', 'rejected', 'archived'];

const USER_ROLES = ['user', 'chef', 'admin'];

const ACCOUNT_STATUSES = ['active', 'inactive', 'suspended', 'deleted'];

const AUDIT_ACTIONS = {
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  RECIPE_CREATED: 'recipe_created',
  RECIPE_UPDATED: 'recipe_updated',
  RECIPE_DELETED: 'recipe_deleted',
  RECIPE_PUBLISHED: 'recipe_published',
  RECIPE_FLAGGED: 'recipe_flagged',
  USER_SUSPENDED: 'user_suspended',
  COMMENT_DELETED: 'comment_deleted',
  ADMIN_ACTION: 'admin_action',
};

// Pagination defaults
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

// File upload constraints
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Token expiry
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const PASSWORD_RESET_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

// Rate limiting
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100;

// Validation constraints
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 30;
const PASSWORD_MIN_LENGTH = 8;
const BIO_MAX_LENGTH = 500;
const RECIPE_TITLE_MAX_LENGTH = 200;
const RECIPE_DESCRIPTION_MAX_LENGTH = 2000;
const COMMENT_MAX_LENGTH = 500;

module.exports = {
  HTTP_STATUS,
  MESSAGES,
  CUISINE_TYPES,
  DIFFICULTY_LEVELS,
  MEAL_TYPES,
  RECIPE_STATUSES,
  USER_ROLES,
  ACCOUNT_STATUSES,
  AUDIT_ACTIONS,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_FORMATS,
  ALLOWED_MIME_TYPES,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
  PASSWORD_RESET_TOKEN_EXPIRY,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  BIO_MAX_LENGTH,
  RECIPE_TITLE_MAX_LENGTH,
  RECIPE_DESCRIPTION_MAX_LENGTH,
  COMMENT_MAX_LENGTH,
};
