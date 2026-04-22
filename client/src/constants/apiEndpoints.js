export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
  },

  // Recipes
  RECIPES: {
    BASE: '/recipes',
    BY_ID: (id) => `/recipes/${id}`,
    BY_CHEF: (chefId) => `/recipes/chef/${chefId}`,
    PUBLISH: (id) => `/recipes/${id}/publish`,
  },

  // Profiles
  PROFILES: {
    BASE: '/profiles',
    BY_ID: (id) => `/profiles/${id}`,
    ME: '/profiles/me',
    ME_DETAILS: '/profiles/me/details',
    ME_IMAGE: '/profiles/me/image',
    ME_BANNER: '/profiles/me/banner',
    STATS: (id) => `/profiles/${id}/stats`,
  },

  // Social
  SOCIAL: {
    LIKE: (recipeId) => `/social/${recipeId}/like`,
    COMMENT: (recipeId) => `/social/${recipeId}/comments`,
    DELETE_COMMENT: (commentId) => `/social/comments/${commentId}`,
    SAVE: (recipeId) => `/social/${recipeId}/save`,
    FOLLOW: (userId) => `/social/users/${userId}/follow`,
    FOLLOWERS: (userId) => `/social/users/${userId}/followers`,
    FOLLOWING: (userId) => `/social/users/${userId}/following`,
    MY_SAVES: '/social/users/me/saves',
  },

  // Search
  SEARCH: {
    RECIPES: '/search/recipes',
    CHEFS: '/search/chefs',
    TRENDING_RECIPES: '/search/trending/recipes',
    TRENDING_CHEFS: '/search/trending/chefs',
  },

  // Analytics
  ANALYTICS: {
    CHEF_RECIPES: '/analytics/chef/recipes',
    CHEF_ENGAGEMENT: '/analytics/chef/engagement',
    RECIPE_VIEWS: (id) => `/analytics/recipe/${id}/views`,
    RECIPE_ENGAGEMENT: (id) => `/analytics/recipe/${id}/engagement`,
  },

  // Admin
  ADMIN: {
    USERS: '/admin/users',
    USER_BY_ID: (id) => `/admin/users/${id}`,
    SUSPEND_USER: (id) => `/admin/users/${id}/suspend`,
    ACTIVATE_USER: (id) => `/admin/users/${id}/activate`,
    DELETE_USER: (id) => `/admin/users/${id}`,
    PENDING_RECIPES: '/admin/recipes/pending',
    APPROVE_RECIPE: (id) => `/admin/recipes/${id}/approve`,
    REJECT_RECIPE: (id) => `/admin/recipes/${id}/reject`,
    FLAG_RECIPE: (id) => `/admin/recipes/${id}/flag`,
    DELETE_COMMENT: (id) => `/admin/comments/${id}`,
    AUDIT_LOGS: '/admin/audit-logs',
    AUDIT_LOGS_EXPORT: '/admin/audit-logs/export',
    STATS: '/admin/stats',
    STATS_USERS: '/admin/stats/users',
    STATS_RECIPES: '/admin/stats/recipes',
  },
};