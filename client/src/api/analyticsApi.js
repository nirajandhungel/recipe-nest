import axiosInstance from './axiosInstance';
import { ENDPOINTS } from '../constants/apiEndpoints';

export const analyticsApi = {
  chefRecipes: (params) => axiosInstance.get(ENDPOINTS.ANALYTICS.CHEF_RECIPES, { params }),
  chefEngagement: (params) => axiosInstance.get(ENDPOINTS.ANALYTICS.CHEF_ENGAGEMENT, { params }),
  recipeViews: (id, params) => axiosInstance.get(ENDPOINTS.ANALYTICS.RECIPE_VIEWS(id), { params }),
  recipeEngagement: (id, params) =>
    axiosInstance.get(ENDPOINTS.ANALYTICS.RECIPE_ENGAGEMENT(id), { params }),
};
