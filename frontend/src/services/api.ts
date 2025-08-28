import axios, { AxiosResponse, AxiosError } from 'axios';
import { ApiResponse, ApiError } from '@/types';

// 创建 axios 实例
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证令牌
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误和令牌过期
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    const apiError: ApiError = {
      message: 'An error occurred',
      status: error.response?.status,
    };

    if (error.response?.data) {
      const errorData = error.response.data as any;
      apiError.message = errorData.message || apiError.message;
      apiError.errors = errorData.errors;
    } else if (error.request) {
      apiError.message = 'Network error - please check your connection';
    } else {
      apiError.message = error.message || apiError.message;
    }

    // 处理认证错误
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      // 重定向到登录页面
      window.location.href = '/login';
    }

    return Promise.reject(apiError);
  }
);

// 通用 API 请求方法
class ApiService {
  // GET 请求
  static async get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    const response = await api.get(url, { params });
    return response.data;
  }

  // POST 请求
  static async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await api.post(url, data);
    return response.data;
  }

  // PUT 请求
  static async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await api.put(url, data);
    return response.data;
  }

  // PATCH 请求
  static async patch<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await api.patch(url, data);
    return response.data;
  }

  // DELETE 请求
  static async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await api.delete(url);
    return response.data;
  }

  // 上传文件
  static async upload<T>(url: string, formData: FormData): Promise<ApiResponse<T>> {
    const response = await api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // 下载文件
  static async download(url: string, filename?: string): Promise<void> {
    const response = await api.get(url, { responseType: 'blob' });
    
    // 创建下载链接
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }
}

export default ApiService;