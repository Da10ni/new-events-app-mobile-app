import axiosInstance from './axiosInstance';
import { API_CONFIG } from '../../config/api.config';
import { ApiResponse, Vendor, Listing, Booking } from '../../types';

const { VENDORS } = API_CONFIG.ENDPOINTS;

export interface CreateVendorRequest {
  businessName: string;
  description?: string;
  categories: string[];
  address: {
    street?: string;
    city: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
}

export const vendorApi = {
  getAll: (params?: Record<string, unknown>) => axiosInstance.get<ApiResponse<{ vendors: Vendor[] }>>(VENDORS.BASE, { params }),
  getBySlug: (slug: string) => axiosInstance.get<ApiResponse<{ vendor: Vendor }>>(`${VENDORS.BASE}/${slug}`),
  getMyProfile: () => axiosInstance.get<ApiResponse<{ vendor: Vendor }>>(VENDORS.ME_PROFILE),
  updateProfile: (data: Partial<Vendor>) => axiosInstance.patch<ApiResponse<{ vendor: Vendor }>>(VENDORS.ME_PROFILE, data),
  toggleAvailability: () => axiosInstance.patch<ApiResponse<{ vendor: Vendor }>>(VENDORS.ME_AVAILABILITY),
  getMyListings: (params?: Record<string, unknown>) => axiosInstance.get<ApiResponse<{ listings: Listing[] }>>(VENDORS.ME_LISTINGS, { params }),
  getMyBookings: (params?: Record<string, unknown>) => axiosInstance.get<ApiResponse<{ bookings: Booking[] }>>(VENDORS.ME_BOOKINGS, { params }),
  create: (data: CreateVendorRequest) => axiosInstance.post<ApiResponse<{ vendor: Vendor }>>(VENDORS.BASE, data),
};
