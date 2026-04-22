import axiosInstance from './axiosInstance';
import { ENDPOINTS } from '../constants/apiEndpoints';

export const socialApi = {
  like: (recipeId) => axiosInstance.post(ENDPOINTS.SOCIAL.LIKE(recipeId)),
  unlike: (recipeId) => axiosInstance.delete(ENDPOINTS.SOCIAL.LIKE(recipeId)),
  addComment: (recipeId, content) =>
    axiosInstance.post(ENDPOINTS.SOCIAL.COMMENT(recipeId), { content }),
  getComments: (recipeId, params) =>
    axiosInstance.get(ENDPOINTS.SOCIAL.COMMENT(recipeId), { params }),
  deleteComment: (commentId) =>
    axiosInstance.delete(ENDPOINTS.SOCIAL.DELETE_COMMENT(commentId)),
  save: (recipeId) => axiosInstance.post(ENDPOINTS.SOCIAL.SAVE(recipeId)),
  unsave: (recipeId) => axiosInstance.delete(ENDPOINTS.SOCIAL.SAVE(recipeId)),
  follow: (userId) => axiosInstance.post(ENDPOINTS.SOCIAL.FOLLOW(userId)),
  unfollow: (userId) => axiosInstance.delete(ENDPOINTS.SOCIAL.FOLLOW(userId)),
  getFollowers: (userId, params) =>
    axiosInstance.get(ENDPOINTS.SOCIAL.FOLLOWERS(userId), { params }),
  getFollowing: (userId, params) =>
    axiosInstance.get(ENDPOINTS.SOCIAL.FOLLOWING(userId), { params }),
  getMySaves: (params) => axiosInstance.get(ENDPOINTS.SOCIAL.MY_SAVES, { params }),
};
