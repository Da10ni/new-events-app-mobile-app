import axiosInstance from './axiosInstance';
import { API_CONFIG } from '../../config/api.config';
import { ApiResponse, Booking, CreateBookingRequest } from '../../types';

const { BOOKINGS } = API_CONFIG.ENDPOINTS;

export const bookingApi = {
  create: (data: CreateBookingRequest) => axiosInstance.post<ApiResponse<{ booking: Booking }>>(BOOKINGS.BASE, data),
  getById: (id: string) => axiosInstance.get<ApiResponse<{ booking: Booking }>>(`${BOOKINGS.BASE}/${id}`),
  getMyBookings: (params?: { page?: number; limit?: number; status?: string }) => axiosInstance.get<ApiResponse<{ bookings: Booking[] }>>(BOOKINGS.MY, { params }),
  updateStatus: (id: string, data: { status: string; vendorResponse?: string }) => axiosInstance.patch(`${BOOKINGS.BASE}/${id}/status`, data),
  cancel: (id: string, cancellationReason: string) => axiosInstance.patch(`${BOOKINGS.BASE}/${id}/cancel`, { cancellationReason }),
  complete: (id: string) => axiosInstance.patch(`${BOOKINGS.BASE}/${id}/complete`),
};
