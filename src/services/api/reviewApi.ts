import axiosInstance from './axiosInstance';
import { API_CONFIG } from '../../config/api.config';
import { ApiResponse, Review } from '../../types';

const { REVIEWS } = API_CONFIG.ENDPOINTS;

export const reviewApi = {
  create: (data: { booking: string; rating: number; comment: string; title?: string; detailedRatings?: Record<string, number> }) => axiosInstance.post<ApiResponse<{ review: Review }>>(REVIEWS.BASE, data),
  getByBooking: (bookingId: string) => axiosInstance.get<ApiResponse<{ review: Review }>>(`${REVIEWS.BASE}/booking/${bookingId}`),
  update: (id: string, data: Partial<{ rating: number; comment: string; title: string }>) => axiosInstance.patch(`${REVIEWS.BASE}/${id}`, data),
  delete: (id: string) => axiosInstance.delete(`${REVIEWS.BASE}/${id}`),
  addReply: (id: string, comment: string) => axiosInstance.post(`${REVIEWS.BASE}/${id}/reply`, { comment }),
};
