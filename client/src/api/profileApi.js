import axiosInstance from './axiosInstance';
import { ENDPOINTS } from '../constants/apiEndpoints';

export const profileApi = {
  getAll: (params) => axiosInstance.get(ENDPOINTS.PROFILES.BASE, { params }),
  getById: (id) => axiosInstance.get(ENDPOINTS.PROFILES.BY_ID(id)),
  getMyDetails: () => axiosInstance.get(ENDPOINTS.PROFILES.ME_DETAILS),
  updateMe: (data) => axiosInstance.put(ENDPOINTS.PROFILES.ME, data),
  uploadImage: (file) => {
    const form = new FormData();
    form.append('image', file);
    return axiosInstance.post(ENDPOINTS.PROFILES.ME_IMAGE, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadBanner: (file) => {
    const form = new FormData();
    form.append('banner', file);
    return axiosInstance.post(ENDPOINTS.PROFILES.ME_BANNER, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getStats: (userId) => axiosInstance.get(ENDPOINTS.PROFILES.STATS(userId)),
};
