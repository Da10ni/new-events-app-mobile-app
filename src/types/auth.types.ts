export interface User {
  _id: string;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'client' | 'vendor' | 'admin';
  avatar: { url: string; publicId: string };
  isEmailVerified: boolean;
  isActive: boolean;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  fullName: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export interface VendorRegisterRequest extends RegisterRequest {
  businessName: string;
  description?: string;
  categories?: string[];
  businessPhone?: string;
  businessEmail?: string;
  address: {
    street?: string;
    city: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  vendor?: Vendor | null;
  accessToken: string;
  refreshToken: string;
}

export interface Vendor {
  _id: string;
  userId: string;
  businessName: string;
  businessSlug: string;
  description?: string;
  categories: Array<{ _id: string; name: string; slug: string }>;
  businessPhone?: string;
  businessEmail?: string;
  address: {
    street?: string;
    city: string;
    state?: string;
    country: string;
    zipCode?: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  averageRating: number;
  totalReviews: number;
  totalListings: number;
  totalBookings: number;
  isAvailable: boolean;
  createdAt: string;
}
