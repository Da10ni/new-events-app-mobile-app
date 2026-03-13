import axiosInstance from './axiosInstance';
import { API_CONFIG } from '../../config/api.config';
import { ApiResponse, Listing, ListingFilter, PaginationMeta } from '../../types';

const { LISTINGS } = API_CONFIG.ENDPOINTS;

export const listingApi = {
  getAll: (params?: ListingFilter) => axiosInstance.get<ApiResponse<{ listings: Listing[] }>>(LISTINGS.BASE, { params }),
  getBySlug: (slug: string) => axiosInstance.get<ApiResponse<{ listing: Listing }>>(`${LISTINGS.BASE}/${slug}`),
  getFeatured: () => axiosInstance.get<ApiResponse<{ listings: Listing[] }>>(LISTINGS.FEATURED),
  create: (data: Record<string, unknown>) => axiosInstance.post<ApiResponse<{ listing: Listing }>>(LISTINGS.BASE, data),
  update: (id: string, data: Record<string, unknown>) => axiosInstance.patch<ApiResponse<{ listing: Listing }>>(`${LISTINGS.BASE}/${id}`, data),
  delete: (id: string) => axiosInstance.delete(`${LISTINGS.BASE}/${id}`),
  getReviews: (id: string, params?: { page?: number; limit?: number }) => axiosInstance.get(`${LISTINGS.BASE}/${id}/reviews`, { params }),
};
