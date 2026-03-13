import axiosInstance from './axiosInstance';
import { API_CONFIG } from '../../config/api.config';
import { ApiResponse, User } from '../../types';

export const userApi = {
  getProfile: () => axiosInstance.get<ApiResponse<{ user: User }>>(API_CONFIG.ENDPOINTS.USERS.ME),
  updateProfile: (data: Partial<User>) => axiosInstance.patch<ApiResponse<{ user: User }>>(API_CONFIG.ENDPOINTS.USERS.ME, data),
};
