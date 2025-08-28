import ApiService from './api';
import { 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  UserProfile,
  ApiResponse 
} from '@/types';

class AuthService {
  // 用户注册
  static async register(userData: RegisterData): Promise<ApiResponse<AuthResponse>> {
    const response = await ApiService.post<AuthResponse>('/auth/register', userData);
    
    if (response.success && response.data) {
      // 保存令牌和用户信息
      this.setAuthData(response.data);
    }
    
    return response;
  }

  // 用户登录
  static async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    const response = await ApiService.post<AuthResponse>('/auth/login', credentials);
    
    if (response.success && response.data) {
      // 保存令牌和用户信息
      this.setAuthData(response.data);
    }
    
    return response;
  }

  // 获取用户资料
  static async getProfile(): Promise<ApiResponse<UserProfile>> {
    return ApiService.get<UserProfile>('/auth/profile');
  }

  // 更新用户资料
  static async updateProfile(profileData: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    bio?: string;
    preferences?: any;
  }): Promise<ApiResponse<{ user: any }>> {
    return ApiService.put<{ user: any }>('/auth/profile', profileData);
  }

  // 修改密码
  static async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<null>> {
    return ApiService.put<null>('/auth/password', passwordData);
  }

  // 刷新令牌
  static async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    const response = await ApiService.post<{ token: string }>('/auth/refresh');
    
    if (response.success && response.data?.token) {
      // 更新令牌
      localStorage.setItem('auth_token', response.data.token);
    }
    
    return response;
  }

  // 退出登录
  static async logout(): Promise<void> {
    try {
      await ApiService.post('/auth/logout');
    } catch (error) {
      // 即使服务器返回错误，也要清除本地数据
      console.warn('Logout request failed:', error);
    } finally {
      this.clearAuthData();
    }
  }

  // 删除账户
  static async deleteAccount(password: string): Promise<ApiResponse<null>> {
    const response = await ApiService.delete<null>('/auth/account');
    
    if (response.success) {
      this.clearAuthData();
    }
    
    return response;
  }

  // 保存认证数据
  private static setAuthData(authData: AuthResponse): void {
    localStorage.setItem('auth_token', authData.token);
    localStorage.setItem('user', JSON.stringify(authData.user));
  }

  // 清除认证数据
  static clearAuthData(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }

  // 获取当前用户
  static getCurrentUser(): any | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.clearAuthData();
      }
    }
    return null;
  }

  // 获取令牌
  static getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // 检查是否已登录
  static isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // 检查令牌是否过期
  static isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      // 解码 JWT 令牌
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true;
    }
  }

  // 自动刷新令牌
  static async autoRefreshToken(): Promise<boolean> {
    if (!this.isAuthenticated() || !this.isTokenExpired()) {
      return true;
    }

    try {
      await this.refreshToken();
      return true;
    } catch (error) {
      console.error('Auto refresh token failed:', error);
      this.clearAuthData();
      return false;
    }
  }
}

export default AuthService;