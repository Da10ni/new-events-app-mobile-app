import axiosInstance from './axiosInstance';
import { API_CONFIG } from '../../config/api.config';

const { UPLOAD } = API_CONFIG.ENDPOINTS;

export const uploadApi = {
  uploadImage: (formData: FormData) => axiosInstance.post(UPLOAD.IMAGE, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadImages: (formData: FormData) => axiosInstance.post(UPLOAD.IMAGES, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteImage: (publicId: string) => axiosInstance.delete(UPLOAD.IMAGE, { data: { publicId } }),
};
