import axiosInstance from './axiosInstance';
import { API_CONFIG } from '../../config/api.config';

const { MESSAGES } = API_CONFIG.ENDPOINTS;

export const messageApi = {
  getConversations: (params?: Record<string, string | number>) =>
    axiosInstance.get(MESSAGES.CONVERSATIONS, { params }),

  createConversation: (data: { vendorId: string; listingId?: string; message?: string }) =>
    axiosInstance.post(MESSAGES.CONVERSATIONS, data),

  getMessages: (conversationId: string, params?: Record<string, string | number>) =>
    axiosInstance.get(`${MESSAGES.CONVERSATIONS}/${conversationId}/messages`, { params }),

  sendMessage: (conversationId: string, text: string, replyTo?: string) =>
    axiosInstance.post(`${MESSAGES.CONVERSATIONS}/${conversationId}/messages`, { text, ...(replyTo && { replyTo }) }),

  markAsRead: (conversationId: string) =>
    axiosInstance.patch(`${MESSAGES.CONVERSATIONS}/${conversationId}/read`),

  editMessage: (conversationId: string, messageId: string, text: string) =>
    axiosInstance.patch(`${MESSAGES.CONVERSATIONS}/${conversationId}/messages/${messageId}`, { text }),

  deleteMessage: (conversationId: string, messageId: string) =>
    axiosInstance.delete(`${MESSAGES.CONVERSATIONS}/${conversationId}/messages/${messageId}`),

  getUnreadCount: () =>
    axiosInstance.get(MESSAGES.UNREAD_COUNT),
};
