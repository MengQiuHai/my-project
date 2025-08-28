import React from 'react';
import { useAuthStore } from '@/store';

const DashboardPage: React.FC = () => {
  const { user, stats } = useAuthStore();

  return (
    <div className=\"space-y-6\">
      <div className=\"border-b border-gray-200 pb-4\">
        <h1 className=\"text-3xl font-bold text-gray-900\">
          欢迎回来，{user?.first_name || user?.username}！
        </h1>
        <p className=\"text-gray-600 mt-1\">
          查看您的学习进展和成长银行余额
        </p>
      </div>

      {/* 统计卡片 */}
      <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6\">
        <div className=\"card\">
          <div className=\"flex items-center\">
            <div className=\"p-3 rounded-full bg-yellow-100\">
              <span className=\"text-2xl\">💰</span>
            </div>
            <div className=\"ml-4\">
              <p className=\"text-sm font-medium text-gray-500\">金币余额</p>
              <p className=\"text-2xl font-semibold text-yellow-600\">
                {stats?.currentBalance || 0}
              </p>
            </div>
          </div>
        </div>

        <div className=\"card\">
          <div className=\"flex items-center\">
            <div className=\"p-3 rounded-full bg-blue-100\">
              <span className=\"text-2xl\">📚</span>
            </div>
            <div className=\"ml-4\">
              <p className=\"text-sm font-medium text-gray-500\">学习会话</p>
              <p className=\"text-2xl font-semibold text-blue-600\">
                {stats?.totalSessions || 0}
              </p>
            </div>
          </div>
        </div>

        <div className=\"card\">
          <div className=\"flex items-center\">
            <div className=\"p-3 rounded-full bg-green-100\">
              <span className=\"text-2xl\">🔥</span>
            </div>
            <div className=\"ml-4\">
              <p className=\"text-sm font-medium text-gray-500\">连续天数</p>
              <p className=\"text-2xl font-semibold text-green-600\">
                {stats?.streakDays || 0}
              </p>
            </div>
          </div>
        </div>

        <div className=\"card\">
          <div className=\"flex items-center\">
            <div className=\"p-3 rounded-full bg-purple-100\">
              <span className=\"text-2xl\">🏆</span>
            </div>
            <div className=\"ml-4\">
              <p className=\"text-sm font-medium text-gray-500\">成就徽章</p>
              <p className=\"text-2xl font-semibold text-purple-600\">
                {stats?.achievementCount || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className=\"card\">
        <h2 className=\"text-lg font-semibold text-gray-900 mb-4\">快速操作</h2>
        <div className=\"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4\">
          <button className=\"p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors\">
            <div className=\"text-center\">
              <span className=\"text-3xl mb-2 block\">📝</span>
              <p className=\"font-medium text-gray-900\">记录学习会话</p>
              <p className=\"text-sm text-gray-500\">添加新的学习记录</p>
            </div>
          </button>

          <button className=\"p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors\">
            <div className=\"text-center\">
              <span className=\"text-3xl mb-2 block\">🎁</span>
              <p className=\"font-medium text-gray-900\">兑换奖励</p>
              <p className=\"text-sm text-gray-500\">使用金币兑换奖励</p>
            </div>
          </button>

          <button className=\"p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors\">
            <div className=\"text-center\">
              <span className=\"text-3xl mb-2 block\">📊</span>
              <p className=\"font-medium text-gray-900\">查看统计</p>
              <p className=\"text-sm text-gray-500\">分析学习数据</p>
            </div>
          </button>
        </div>
      </div>

      {/* 今日概览 */}
      <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
        <div className=\"card\">
          <h2 className=\"text-lg font-semibold text-gray-900 mb-4\">今日学习</h2>
          <div className=\"text-center py-8 text-gray-500\">
            <span className=\"text-4xl mb-2 block\">📅</span>
            <p>今天还没有学习记录</p>
            <p className=\"text-sm\">开始学习来获得金币吧！</p>
          </div>
        </div>

        <div className=\"card\">
          <h2 className=\"text-lg font-semibent text-gray-900 mb-4\">最近成就</h2>
          <div className=\"text-center py-8 text-gray-500\">
            <span className=\"text-4xl mb-2 block\">🏆</span>
            <p>暂无成就</p>
            <p className=\"text-sm\">继续学习来解锁成就！</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;