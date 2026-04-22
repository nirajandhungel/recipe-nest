import axiosInstance from './axiosInstance';
import { ENDPOINTS } from '../constants/apiEndpoints';

export const adminApi = {
  getUsers: (params) => axiosInstance.get(ENDPOINTS.ADMIN.USERS, { params }),
  getUserById: (id) => axiosInstance.get(ENDPOINTS.ADMIN.USER_BY_ID(id)),
  suspendUser: (id) => axiosInstance.post(ENDPOINTS.ADMIN.SUSPEND_USER(id)),
  activateUser: (id) => axiosInstance.post(ENDPOINTS.ADMIN.ACTIVATE_USER(id)),
  deleteUser: (id) => axiosInstance.delete(ENDPOINTS.ADMIN.DELETE_USER(id)),
  toggleFeatured: (id, isFeatured) =>
    axiosInstance.patch(`/admin/users/${id}/featured`, { isFeatured }),
  getPendingRecipes: (params) => axiosInstance.get(ENDPOINTS.ADMIN.PENDING_RECIPES, { params }),
  approveRecipe: (id) => axiosInstance.post(ENDPOINTS.ADMIN.APPROVE_RECIPE(id)),
  rejectRecipe: (id, reason) =>
    axiosInstance.post(ENDPOINTS.ADMIN.REJECT_RECIPE(id), { reason }),
  flagRecipe: (id, reason) =>
    axiosInstance.post(ENDPOINTS.ADMIN.FLAG_RECIPE(id), { reason }),
  deleteComment: (id) => axiosInstance.delete(ENDPOINTS.ADMIN.DELETE_COMMENT(id)),
  getAuditLogs: (params) => axiosInstance.get(ENDPOINTS.ADMIN.AUDIT_LOGS, { params }),
  exportAuditLogs: () => axiosInstance.get(ENDPOINTS.ADMIN.AUDIT_LOGS_EXPORT, { responseType: 'blob' }),
  getStats: () => axiosInstance.get(ENDPOINTS.ADMIN.STATS),
  getUserStats: () => axiosInstance.get(ENDPOINTS.ADMIN.STATS_USERS),
  getRecipeStats: () => axiosInstance.get(ENDPOINTS.ADMIN.STATS_RECIPES),
};
