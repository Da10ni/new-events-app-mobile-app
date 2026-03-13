import { Platform } from 'react-native';

export const APP_NAME = 'Events Platform';
export const APP_VERSION = '1.0.0';

export const LAYOUT = {
  TAB_BAR_HEIGHT: Platform.OS === 'ios' ? 88 : 72,
  TAB_BAR_PADDING_BOTTOM: Platform.OS === 'ios' ? 24 : 14,
  SCREEN_BOTTOM_PADDING: Platform.OS === 'ios' ? 104 : 88,
};

export const ROLES = {
  CLIENT: 'client',
  VENDOR: 'vendor',
  ADMIN: 'admin',
} as const;

export const BOOKING_STATUSES = {
  INQUIRY: 'inquiry',
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const;

export const LISTING_STATUSES = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
} as const;

export const DEFAULT_CATEGORIES = [
  { name: 'Venues', slug: 'venues', icon: 'business' },
  { name: 'Catering', slug: 'catering', icon: 'restaurant' },
  { name: 'Decoration', slug: 'decoration', icon: 'color-palette' },
  { name: 'Beach Huts', slug: 'beach-huts', icon: 'umbrella' },
  { name: 'Farm Houses', slug: 'farm-houses', icon: 'home' },
  { name: 'Photography', slug: 'photography', icon: 'camera' },
  { name: 'DJ & Music', slug: 'dj-music', icon: 'musical-notes' },
  { name: 'Makeup', slug: 'makeup-artists', icon: 'brush' },
  { name: 'Transport', slug: 'transport', icon: 'car' },
  { name: 'Other', slug: 'other-services', icon: 'ellipsis-horizontal' },
];

export const PRICE_UNITS: Record<string, string> = {
  per_event: '/ event',
  per_day: '/ day',
  per_night: '/ night',
  per_hour: '/ hour',
  per_person: '/ person',
  per_plate: '/ plate',
  package: 'package',
};
