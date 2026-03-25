import { Platform } from 'react-native';

const API_BASE_URL = (
  Platform.OS === 'web'
    ? 'http://localhost:5000/api/v1'
    : process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1'
).trim();

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      REGISTER_VENDOR: '/auth/register/vendor',
      REFRESH: '/auth/refresh-token',
      LOGOUT: '/auth/logout',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
      VERIFY_EMAIL: '/auth/verify-email',
      CHANGE_PASSWORD: '/auth/change-password',
    },
    USERS: { ME: '/users/me' },
    VENDORS: {
      BASE: '/vendors',
      ME_PROFILE: '/vendors/me/profile',
      ME_AVAILABILITY: '/vendors/me/availability',
      ME_LISTINGS: '/vendors/me/listings',
      ME_BOOKINGS: '/vendors/me/bookings',
    },
    LISTINGS: {
      BASE: '/listings',
      FEATURED: '/listings/featured',
      SEARCH: '/listings',
    },
    CATEGORIES: { BASE: '/categories' },
    BOOKINGS: {
      BASE: '/bookings',
      MY: '/bookings/my',
    },
    REVIEWS: { BASE: '/reviews' },
    NOTIFICATIONS: {
      BASE: '/notifications',
      UNREAD_COUNT: '/notifications/unread-count',
      READ_ALL: '/notifications/read-all',
    },
    PAYMENTS: {
      CREATE_INTENT: '/payments/create-intent',
      CONFIRM: '/payments/confirm',
    },
    FAVORITES: { BASE: '/favorites' },
    MESSAGES: {
      CONVERSATIONS: '/messages/conversations',
      UNREAD_COUNT: '/messages/unread-count',
    },
    UPLOAD: {
      IMAGE: '/upload/image',
      IMAGES: '/upload/images',
    },
  },
};
