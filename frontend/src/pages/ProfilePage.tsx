import React from 'react';

const ProfilePage: React.FC = () => {
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

export default ProfilePage;