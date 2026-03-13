import axiosInstance from './axiosInstance';
import { API_CONFIG } from '../../config/api.config';

const { FAVORITES } = API_CONFIG.ENDPOINTS;

export const favoriteApi = {
  getAll: (params?: { page?: number; limit?: number }) => axiosInstance.get(FAVORITES.BASE, { params }),
  add: (listing: string) => axiosInstance.post(FAVORITES.BASE, { listing }),
  remove: (listingId: string) => axiosInstance.delete(`${FAVORITES.BASE}/${listingId}`),
  check: (listingId: string) => axiosInstance.get(`${FAVORITES.BASE}/${listingId}/check`),
};
