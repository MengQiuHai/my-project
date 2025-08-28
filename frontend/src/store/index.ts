import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { User, UserStats, SessionWithDetails } from '@/types';
import AuthService from '@/services/auth';

// 认证状态接口
interface AuthState {
  user: User | null;
  stats: UserStats | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// 认证状态操作接口
interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  loadProfile: () => Promise<void>;
  updateProfile: (profileData: any) => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// 会话状态接口
interface SessionState {
  sessions: SessionWithDetails[];
  currentSession: SessionWithDetails | null;
  isLoading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
}

// 会话状态操作接口
interface SessionActions {
  loadSessions: (params?: any) => Promise<void>;
  createSession: (sessionData: any) => Promise<void>;
  updateSession: (sessionId: string, sessionData: any) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  setCurrentSession: (session: SessionWithDetails | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// 认证状态管理
export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    (set, get) => ({
      // 初始状态
      user: AuthService.getCurrentUser(),
      stats: null,
      isAuthenticated: AuthService.isAuthenticated(),
      isLoading: false,
      error: null,

      // 登录
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await AuthService.login({ email, password });
          
          if (response.success && response.data) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
            
            // 加载用户统计信息
            await get().loadProfile();
          }
        } catch (error: any) {
          set({
            error: error.message || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      // 注册
      register: async (userData: any) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await AuthService.register(userData);
          
          if (response.success && response.data) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
          }
        } catch (error: any) {
          set({
            error: error.message || 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      // 退出登录
      logout: async () => {
        try {
          await AuthService.logout();
        } catch (error) {
          console.warn('Logout request failed:', error);
        } finally {
          set({
            user: null,
            stats: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      // 加载用户资料
      loadProfile: async () => {
        try {
          set({ isLoading: true });
          
          const response = await AuthService.getProfile();
          
          if (response.success && response.data) {
            set({
              user: response.data.user,
              stats: response.data.stats,
              isLoading: false,
            });
          }
        } catch (error: any) {
          set({
            error: error.message || 'Failed to load profile',
            isLoading: false,
          });
        }
      },

      // 更新用户资料
      updateProfile: async (profileData: any) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await AuthService.updateProfile(profileData);
          
          if (response.success && response.data) {
            set({
              user: response.data.user,
              isLoading: false,
            });
            
            // 更新本地存储
            localStorage.setItem('user', JSON.stringify(response.data.user));
          }
        } catch (error: any) {
          set({
            error: error.message || 'Failed to update profile',
            isLoading: false,
          });
          throw error;
        }
      },

      // 清除错误
      clearError: () => set({ error: null }),

      // 设置加载状态
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-store',
    }
  )
);

// 会话状态管理
export const useSessionStore = create<SessionState & SessionActions>()(
  devtools(
    (set, get) => ({
      // 初始状态
      sessions: [],
      currentSession: null,
      isLoading: false,
      error: null,
      totalPages: 0,
      currentPage: 1,

      // 加载会话列表
      loadSessions: async (params = {}) => {
        try {
          set({ isLoading: true, error: null });
          
          // 这里需要实现 SessionService
          // const response = await SessionService.getSessions(params);
          
          // 临时模拟数据
          set({
            sessions: [],
            totalPages: 0,
            currentPage: params.page || 1,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to load sessions',
            isLoading: false,
          });
        }
      },

      // 创建会话
      createSession: async (sessionData: any) => {
        try {
          set({ isLoading: true, error: null });
          
          // 这里需要实现 SessionService
          // const response = await SessionService.createSession(sessionData);
          
          // 重新加载会话列表
          await get().loadSessions();
          
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to create session',
            isLoading: false,
          });
          throw error;
        }
      },

      // 更新会话
      updateSession: async (sessionId: string, sessionData: any) => {
        try {
          set({ isLoading: true, error: null });
          
          // 这里需要实现 SessionService
          // const response = await SessionService.updateSession(sessionId, sessionData);
          
          // 重新加载会话列表
          await get().loadSessions();
          
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to update session',
            isLoading: false,
          });
          throw error;
        }
      },

      // 删除会话
      deleteSession: async (sessionId: string) => {
        try {
          set({ isLoading: true, error: null });
          
          // 这里需要实现 SessionService
          // await SessionService.deleteSession(sessionId);
          
          // 重新加载会话列表
          await get().loadSessions();
          
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to delete session',
            isLoading: false,
          });
          throw error;
        }
      },

      // 设置当前会话
      setCurrentSession: (session: SessionWithDetails | null) => {
        set({ currentSession: session });
      },

      // 清除错误
      clearError: () => set({ error: null }),

      // 设置加载状态
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'session-store',
    }
  )
);

// 导出 store hooks
export const useAuth = () => useAuthStore();
export const useSession = () => useSessionStore();