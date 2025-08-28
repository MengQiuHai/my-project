import React from 'react';

export const AchievementsPage: React.FC = () => {
  return (
    <div className=\"space-y-6\">
      <div className=\"border-b border-gray-200 pb-4\">
        <h1 className=\"text-3xl font-bold text-gray-900\">成就系统</h1>
        <p className=\"text-gray-600 mt-1\">查看您的徽章和成就</p>
      </div>
      
      <div className=\"card text-center py-12\">
        <span className=\"text-6xl mb-4 block\">🏆</span>
        <h2 className=\"text-xl font-semibold text-gray-900 mb-2\">成就系统开发中</h2>
        <p className=\"text-gray-500\">即将为您提供丰富的成就徽章系统</p>
      </div>
    </div>
  );
};

export const RewardsPage: React.FC = () => {
  return (
    <div className=\"space-y-6\">
      <div className=\"border-b border-gray-200 pb-4\">
        <h1 className=\"text-3xl font-bold text-gray-900\">奖励商店</h1>
        <p className=\"text-gray-600 mt-1\">使用金币兑换各种奖励</p>
      </div>
      
      <div className=\"card text-center py-12\">
        <span className=\"text-6xl mb-4 block\">🎁</span>
        <h2 className=\"text-xl font-semibold text-gray-900 mb-2\">奖励商店开发中</h2>
        <p className=\"text-gray-500\">即将为您提供个性化的奖励兑换功能</p>
      </div>
    </div>
  );
};

export const ProfilePage: React.FC = () => {
  return (
    <div className=\"space-y-6\">
      <div className=\"border-b border-gray-200 pb-4\">
        <h1 className=\"text-3xl font-bold text-gray-900\">个人资料</h1>
        <p className=\"text-gray-600 mt-1\">管理您的账户信息和设置</p>
      </div>
      
      <div className=\"card text-center py-12\">
        <span className=\"text-6xl mb-4 block\">👤</span>
        <h2 className=\"text-xl font-semibold text-gray-900 mb-2\">个人资料页面开发中</h2>
        <p className=\"text-gray-500\">即将为您提供完整的个人资料管理功能</p>
      </div>
    </div>
  );
};

export const NotFoundPage: React.FC = () => {
  return (
    <div className=\"min-h-screen flex items-center justify-center bg-gray-50\">
      <div className=\"text-center\">
        <span className=\"text-8xl mb-4 block\">😕</span>
        <h1 className=\"text-4xl font-bold text-gray-900 mb-2\">404</h1>
        <p className=\"text-xl text-gray-600 mb-8\">页面未找到</p>
        <a
          href=\"/dashboard\"
          className=\"btn-primary\"
        >
          返回首页
        </a>
      </div>
    </div>
  );
};

export default AchievementsPage;