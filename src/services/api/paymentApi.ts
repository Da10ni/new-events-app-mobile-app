import axiosInstance from './axiosInstance';
import { API_CONFIG } from '../../config/api.config';
import type { ApiResponse } from '../../types';

const { PAYMENTS } = API_CONFIG.ENDPOINTS;

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

export interface PaymentConfirmResponse {
  status: string;
  message: string;
}

export const paymentApi = {
  createIntent: (bookingId: string) =>
    axiosInstance.post<ApiResponse<PaymentIntentResponse>>(PAYMENTS.CREATE_INTENT, { bookingId }),

  confirm: (bookingId: string) =>
    axiosInstance.post<ApiResponse<PaymentConfirmResponse>>(PAYMENTS.CONFIRM, { bookingId }),
};
