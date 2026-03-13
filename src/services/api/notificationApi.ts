import axiosInstance from './axiosInstance';
import { API_CONFIG } from '../../config/api.config';

const { NOTIFICATIONS } = API_CONFIG.ENDPOINTS;

export const notificationApi = {
  getAll: (params?: { page?: number; limit?: number }) => axiosInstance.get(NOTIFICATIONS.BASE, { params }),
  getUnreadCount: () => axiosInstance.get(NOTIFICATIONS.UNREAD_COUNT),
  markAsRead: (id: string) => axiosInstance.patch(`${NOTIFICATIONS.BASE}/${id}/read`),
  markAllAsRead: () => axiosInstance.patch(NOTIFICATIONS.READ_ALL),
  delete: (id: string) => axiosInstance.delete(`${NOTIFICATIONS.BASE}/${id}`),
};
