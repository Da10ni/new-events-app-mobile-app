import axiosInstance from './axiosInstance';
import { API_CONFIG } from '../../config/api.config';
import { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, VendorRegisterRequest } from '../../types';

const { AUTH } = API_CONFIG.ENDPOINTS;

export const authApi = {
  login: (data: LoginRequest) => axiosInstance.post<ApiResponse<AuthResponse>>(AUTH.LOGIN, data),
  register: (data: RegisterRequest) => axiosInstance.post<ApiResponse<AuthResponse>>(AUTH.REGISTER, data),
  registerVendor: (data: VendorRegisterRequest) => axiosInstance.post<ApiResponse<AuthResponse>>(AUTH.REGISTER_VENDOR, data),
  refreshToken: (refreshToken: string) => axiosInstance.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(AUTH.REFRESH, { refreshToken }),
  logout: (refreshToken: string) => axiosInstance.post(AUTH.LOGOUT, { refreshToken }),
  forgotPassword: (email: string) => axiosInstance.post(AUTH.FORGOT_PASSWORD, { email }),
  resetPassword: (data: { email: string; otp: string; newPassword: string }) => axiosInstance.post(AUTH.RESET_PASSWORD, data),
  verifyEmail: (data: { email: string; otp: string }) => axiosInstance.post(AUTH.VERIFY_EMAIL, data),
  changePassword: (data: { currentPassword: string; newPassword: string }) => axiosInstance.post(AUTH.CHANGE_PASSWORD, data),
};
