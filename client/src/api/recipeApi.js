import axiosInstance from './axiosInstance';
import { ENDPOINTS } from '../constants/apiEndpoints';

/**
 * Build a FormData payload from recipe data + optional image file.
 * Arrays (ingredients, steps, tags) are JSON-stringified so they
 * survive multipart transport and the backend can JSON.parse them.
 */
const buildFormData = (data, imageFile) => {
  const fd = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      fd.append(key, JSON.stringify(value));
    } else {
      fd.append(key, value);
    }
  });

  if (imageFile) {
    fd.append('image', imageFile);
  }

  return fd;
};

const multipartConfig = { headers: { 'Content-Type': 'multipart/form-data' } };

export const recipeApi = {
  getAll: (params) => axiosInstance.get(ENDPOINTS.RECIPES.BASE, { params }),
  getById: (id) => axiosInstance.get(ENDPOINTS.RECIPES.BY_ID(id)),
  getByChef: (chefId, params) => axiosInstance.get(ENDPOINTS.RECIPES.BY_CHEF(chefId), { params }),

  // FIX: send FormData so multer can parse the 'image' field on the server
  create: (data, imageFile) =>
    axiosInstance.post(ENDPOINTS.RECIPES.BASE, buildFormData(data, imageFile), multipartConfig),

  update: (id, data, imageFile) =>
    axiosInstance.put(ENDPOINTS.RECIPES.BY_ID(id), buildFormData(data, imageFile), multipartConfig),

  delete: (id) => axiosInstance.delete(ENDPOINTS.RECIPES.BY_ID(id)),
  publish: (id) => axiosInstance.post(ENDPOINTS.RECIPES.PUBLISH(id)),
};