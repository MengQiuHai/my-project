import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store';
import AuthService from '@/services/auth';

// 页面组件
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import SessionsPage from '@/pages/SessionsPage';
import AchievementsPage from '@/pages/AchievementsPage';
import RewardsPage from '@/pages/RewardsPage';
import ProfilePage from '@/pages/ProfilePage';
import NotFoundPage from '@/pages/NotFoundPage';

// 布局组件
import MainLayout from '@/components/layouts/MainLayout';
import AuthLayout from '@/components/layouts/AuthLayout';

// 路由保护组件
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

function App() {
  const { isAuthenticated, loadProfile } = useAuthStore();

  useEffect(() => {
    // 检查是否已登录并加载用户信息
    const initAuth = async () => {
      if (AuthService.isAuthenticated() && !AuthService.isTokenExpired()) {
        try {
          await loadProfile();
        } catch (error) {
          console.error('Failed to load user profile:', error);
          AuthService.clearAuthData();
        }
      } else {
        AuthService.clearAuthData();
      }
    };

    initAuth();
  }, [loadProfile]);

  // 自动刷新令牌
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(async () => {
        const success = await AuthService.autoRefreshToken();
        if (!success) {
          // 令牌刷新失败，重定向到登录页
          window.location.href = '/login';
        }
      }, 30 * 60 * 1000); // 每30分钟检查一次

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  return (
    <div className=\"App min-h-screen bg-gray-50\">
      <Router>
        <Routes>
          {/* 公开路由 - 未登录用户 */}
          <Route path=\"/login\" element={
            <PublicRoute>
              <AuthLayout>
                <LoginPage />
              </AuthLayout>
            </PublicRoute>
          } />
          
          <Route path=\"/register\" element={
            <PublicRoute>
              <AuthLayout>
                <RegisterPage />
              </AuthLayout>
            </PublicRoute>
          } />

          {/* 受保护的路由 - 已登录用户 */}
          <Route path=\"/dashboard\" element={
            <ProtectedRoute>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path=\"/sessions\" element={
            <ProtectedRoute>
              <MainLayout>
                <SessionsPage />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path=\"/achievements\" element={
            <ProtectedRoute>
              <MainLayout>
                <AchievementsPage />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path=\"/rewards\" element={
            <ProtectedRoute>
              <MainLayout>
                <RewardsPage />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path=\"/profile\" element={
            <ProtectedRoute>
              <MainLayout>
                <ProfilePage />
              </MainLayout>
            </ProtectedRoute>
          } />

          {/* 默认路由 */}
          <Route path=\"/\" element={
            <Navigate to={isAuthenticated ? \"/dashboard\" : \"/login\"} replace />
          } />

          {/* 404 页面 */}
          <Route path=\"*\" element={<NotFoundPage />} />
        </Routes>
      </Router>

      {/* 全局通知 */}
      <Toaster
        position=\"top-right\"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

export default App;