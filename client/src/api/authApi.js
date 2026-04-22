import axiosInstance from './axiosInstance';
import { ENDPOINTS } from '../constants/apiEndpoints';

export const authApi = {
  register: (data) => axiosInstance.post(ENDPOINTS.AUTH.REGISTER, data),
  login: (data) => axiosInstance.post(ENDPOINTS.AUTH.LOGIN, data),
  logout: () => axiosInstance.post(ENDPOINTS.AUTH.LOGOUT),
  me: () => axiosInstance.get(ENDPOINTS.AUTH.ME),
  refresh: (refreshToken) => axiosInstance.post(ENDPOINTS.AUTH.REFRESH, { refreshToken }),
  forgotPassword: (email) => axiosInstance.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email }),
  resetPassword: (token, password) =>
    axiosInstance.post(ENDPOINTS.AUTH.RESET_PASSWORD, { token, password }),
  verifyEmail: (token) => axiosInstance.post(ENDPOINTS.AUTH.VERIFY_EMAIL, { token }),
};