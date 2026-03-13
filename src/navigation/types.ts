import type { NavigatorScreenParams } from '@react-navigation/native';

// ─── Auth Stack ───────────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  OtpVerification: {
    email: string;
    flow: 'emailVerification' | 'passwordReset';
  };
  RoleSelection: undefined;
};

// ─── Client Tab Navigator ─────────────────────────────────────────────────────

export type ClientTabParamList = {
  ExploreTab: NavigatorScreenParams<ExploreStackParamList>;
  WishlistTab: NavigatorScreenParams<WishlistStackParamList>;
  BookingsTab: NavigatorScreenParams<BookingsStackParamList>;
  InboxTab: NavigatorScreenParams<InboxStackParamList>;
};

// ─── Client Stack Navigators ──────────────────────────────────────────────────

export type ExploreStackParamList = {
  ExploreScreen: undefined;
  ListingDetailScreen: { listingId: string };
  BookingRequestScreen: { listingId: string; vendorId: string };
  BookingConfirmationScreen: { bookingId: string };
  EditProfileScreen: undefined;
  SettingsScreen: undefined;
  NotificationsScreen: undefined;
};

export type WishlistStackParamList = {
  WishlistScreen: undefined;
  ListingDetailScreen: { listingId: string };
};

export type BookingsStackParamList = {
  BookingsScreen: undefined;
  BookingDetailScreen: { bookingId: string };
  ReviewScreen: { bookingId: string; listingId: string; vendorId: string };
};

export type InboxStackParamList = {
  InboxScreen: undefined;
  ChatScreen: { conversationId: string; recipientName: string };
};

export type ProfileStackParamList = {
  ProfileScreen: undefined;
  EditProfileScreen: undefined;
  SettingsScreen: undefined;
  NotificationsScreen: undefined;
};

// ─── Provider Tab Navigator ───────────────────────────────────────────────────

export type ProviderTabParamList = {
  DashboardTab: NavigatorScreenParams<ProviderDashboardStackParamList>;
  ListingsTab: NavigatorScreenParams<ProviderListingsStackParamList>;
  ProviderBookingsTab: NavigatorScreenParams<ProviderBookingsStackParamList>;
  ProviderInboxTab: NavigatorScreenParams<ProviderInboxStackParamList>;
  ProviderProfileTab: NavigatorScreenParams<ProviderProfileStackParamList>;
};

// ─── Provider Stack Navigators ────────────────────────────────────────────────

export type ProviderDashboardStackParamList = {
  DashboardScreen: undefined;
  EarningsScreen: undefined;
};

export type ProviderListingsStackParamList = {
  MyListingsScreen: undefined;
  AddListingScreen: undefined;
  EditListingScreen: { listingId: string };
  ListingPreviewScreen: { listingId: string };
};

export type ProviderBookingsStackParamList = {
  ProviderBookingsScreen: undefined;
  ProviderBookingDetailScreen: { bookingId: string };
};

export type ProviderInboxStackParamList = {
  ProviderInboxScreen: undefined;
  ProviderChatScreen: { conversationId: string; recipientName: string };
};

export type ProviderProfileStackParamList = {
  ProviderProfileScreen: undefined;
  EditProviderProfileScreen: undefined;
  ProviderSettingsScreen: undefined;
};

// ─── Root Navigator ───────────────────────────────────────────────────────────

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Client: NavigatorScreenParams<ClientTabParamList>;
  Provider: NavigatorScreenParams<ProviderTabParamList>;
};

// ─── Navigation Prop Helpers ──────────────────────────────────────────────────

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
