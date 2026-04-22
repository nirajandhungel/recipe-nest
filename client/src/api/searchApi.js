import axiosInstance from './axiosInstance';
import { ENDPOINTS } from '../constants/apiEndpoints';

export const searchApi = {
  recipes: (params) => axiosInstance.get(ENDPOINTS.SEARCH.RECIPES, { params }),
  chefs: (params) => axiosInstance.get(ENDPOINTS.SEARCH.CHEFS, { params }),
  trendingRecipes: (params) => axiosInstance.get(ENDPOINTS.SEARCH.TRENDING_RECIPES, { params }),
  trendingChefs: (params) => axiosInstance.get(ENDPOINTS.SEARCH.TRENDING_CHEFS, { params }),
};
