import axiosInstance from './axiosInstance';
import { API_CONFIG } from '../../config/api.config';
import { ApiResponse, Category } from '../../types';

export const categoryApi = {
  getAll: () => axiosInstance.get<ApiResponse<{ categories: Category[] }>>(API_CONFIG.ENDPOINTS.CATEGORIES.BASE),
  getBySlug: (slug: string) => axiosInstance.get<ApiResponse<{ category: Category }>>(`${API_CONFIG.ENDPOINTS.CATEGORIES.BASE}/${slug}`),
  getListings: (slug: string, params?: Record<string, unknown>) => axiosInstance.get(`${API_CONFIG.ENDPOINTS.CATEGORIES.BASE}/${slug}/listings`, { params }),
};
