import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className=\"min-h-screen flex items-center justify-center bg-gray-50\">
      <div className=\"text-center\">
        <span className=\"text-8xl mb-4 block\">😕</span>
        <h1 className=\"text-4xl font-bold text-gray-900 mb-2\">404</h1>
        <p className=\"text-xl text-gray-600 mb-8\">页面未找到</p>
        <Link
          to=\"/dashboard\"
          className=\"btn-primary\"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;