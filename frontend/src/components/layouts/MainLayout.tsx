import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  HomeIcon,
  BookOpenIcon,
  TrophyIcon,
  GiftIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store';
import toast from 'react-hot-toast';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, stats, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: '仪表盘', href: '/dashboard', icon: HomeIcon },
    { name: '学习会话', href: '/sessions', icon: BookOpenIcon },
    { name: '成就系统', href: '/achievements', icon: TrophyIcon },
    { name: '奖励商店', href: '/rewards', icon: GiftIcon },
    { name: '个人资料', href: '/profile', icon: UserIcon },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('已成功退出登录');
      navigate('/login');
    } catch (error) {
      toast.error('退出登录失败');
    }
  };

  return (
    <div className=\"min-h-screen bg-gray-50\">
      {/* 移动端侧边栏 */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className=\"fixed inset-0 bg-gray-600 bg-opacity-75\" onClick={() => setSidebarOpen(false)} />
        <div className=\"fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl\">
          <div className=\"flex h-16 items-center justify-between px-4 border-b border-gray-200\">
            <div className=\"flex items-center\">
              <span className=\"text-2xl\">💰</span>
              <span className=\"ml-2 text-lg font-semibold text-gray-900\">成长银行</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className=\"text-gray-500 hover:text-gray-700\"
            >
              <XMarkIcon className=\"h-6 w-6\" />
            </button>
          </div>
          
          <nav className=\"flex-1 px-4 py-4 space-y-1\">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-blue-500' : 'text-gray-400'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          <div className=\"border-t border-gray-200 p-4\">
            <button
              onClick={handleLogout}
              className=\"group flex w-full items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors\"
            >
              <ArrowRightOnRectangleIcon className=\"mr-3 h-5 w-5 text-gray-400\" />
              退出登录
            </button>
          </div>
        </div>
      </div>

      {/* 桌面端侧边栏 */}
      <div className=\"hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0\">
        <div className=\"flex flex-col flex-grow bg-white border-r border-gray-200\">
          <div className=\"flex items-center h-16 px-4 border-b border-gray-200\">
            <span className=\"text-2xl\">💰</span>
            <span className=\"ml-2 text-lg font-semibold text-gray-900\">成长银行</span>
          </div>
          
          <div className=\"flex flex-col flex-grow overflow-y-auto\">
            {/* 用户信息 */}
            <div className=\"p-4 border-b border-gray-200\">
              <div className=\"flex items-center\">
                <div className=\"h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center\">
                  <span className=\"text-white font-semibold text-sm\">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className=\"ml-3\">
                  <p className=\"text-sm font-medium text-gray-900\">
                    {user?.first_name || user?.username}
                  </p>
                  <div className=\"flex items-center text-xs text-yellow-600\">
                    <span>💰</span>
                    <span className=\"ml-1\">{stats?.currentBalance || 0} 金币</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 导航菜单 */}
            <nav className=\"flex-1 px-4 py-4 space-y-1\">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 ${
                        isActive ? 'text-blue-500' : 'text-gray-400'
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            
            {/* 退出登录 */}
            <div className=\"border-t border-gray-200 p-4\">
              <button
                onClick={handleLogout}
                className=\"group flex w-full items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors\"
              >
                <ArrowRightOnRectangleIcon className=\"mr-3 h-5 w-5 text-gray-400\" />
                退出登录
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className=\"lg:pl-64\">
        {/* 顶部导航栏 */}
        <div className=\"sticky top-0 z-10 bg-white border-b border-gray-200 lg:hidden\">
          <div className=\"flex items-center justify-between h-16 px-4\">
            <button
              onClick={() => setSidebarOpen(true)}
              className=\"text-gray-500 hover:text-gray-700\"
            >
              <Bars3Icon className=\"h-6 w-6\" />
            </button>
            
            <div className=\"flex items-center\">
              <span className=\"text-xl\">💰</span>
              <span className=\"ml-2 font-semibold text-gray-900\">成长银行</span>
            </div>
            
            <div className=\"flex items-center text-sm text-yellow-600\">
              <span>💰</span>
              <span className=\"ml-1\">{stats?.currentBalance || 0}</span>
            </div>
          </div>
        </div>

        {/* 页面内容 */}
        <main className=\"py-6 px-4 sm:px-6 lg:px-8\">
          <div className=\"mx-auto max-w-7xl\">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;