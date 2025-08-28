import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  TrophyIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  FireIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { api } from '@/services';
import { LoadingSpinner } from '@/components/ui';

interface AnalyticsData {
  overview: {
    totalSessions: number;
    totalFocusTime: number;
    totalCoinsEarned: number;
    avgEfficiency: number;
    studyStreak: number;
  };
  trends: Array<{
    date: string;
    sessions: number;
    focusTime: number;
    coins: number;
    efficiency: number;
  }>;
  subjects: Array<{
    subject: string;
    sessionCount: number;
    totalFocusTime: number;
    totalCoins: number;
    avgSessionTime: number;
    efficiency: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }>;
  performance: {
    avgDailyFocus: number;
    avgDailyCoins: number;
    productivity: number;
    consistency: number;
    improvement: number;
  };
  recommendations: string[];
  insights: string[];
}

interface ComparativeData {
  userRank: number;
  totalUsers: number;
  percentile: number;
  comparisons: {
    avgFocusTime: { user: number; average: number; };
    avgCoins: { user: number; average: number; };
    streak: { user: number; average: number; };
  };
}

const AnalyticsPage: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [comparativeData, setComparativeData] = useState<ComparativeData | null>(null);
  const [period, setPeriod] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [period]);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      const [analyticsResponse, comparativeResponse] = await Promise.all([
        api.get(`/api/stats/analytics?period=${period}`),
        api.get('/api/stats/comparative'),
      ]);

      setAnalyticsData(analyticsResponse.data.data);
      setComparativeData(comparativeResponse.data.data);
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error);
      toast.error('无法加载分析数据');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const getEfficiencyColor = (efficiency: number): string => {
    if (efficiency >= 40) return 'text-green-600';
    if (efficiency >= 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <ArrowTrendingUpIcon className=\"h-4 w-4 text-green-500\" />;
      case 'decreasing':
        return <ArrowTrendingDownIcon className=\"h-4 w-4 text-red-500\" />;
      default:
        return <div className=\"h-4 w-4 bg-gray-400 rounded-full\" />;
    }
  };

  const getPerformanceColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  if (isLoading) {
    return (
      <div className=\"min-h-screen flex items-center justify-center\">
        <LoadingSpinner size=\"large\" />
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className=\"min-h-screen flex items-center justify-center\">
        <div className=\"text-center\">
          <p className=\"text-gray-500\">无法加载分析数据</p>
          <button
            onClick={fetchAnalyticsData}
            className=\"mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700\"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className=\"min-h-screen bg-gray-50 py-8\">
      <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">
        {/* Header */}
        <div className=\"mb-8\">
          <div className=\"flex items-center justify-between\">
            <h1 className=\"text-3xl font-bold text-gray-900\">学习分析</h1>
            
            <div className=\"flex items-center space-x-4\">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className=\"px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500\"
              >
                <option value=\"7d\">最近7天</option>
                <option value=\"30d\">最近30天</option>
                <option value=\"90d\">最近90天</option>
                <option value=\"1y\">最近一年</option>
              </select>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8\">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className=\"bg-white rounded-lg shadow p-6\"
          >
            <div className=\"flex items-center\">
              <ChartBarIcon className=\"h-8 w-8 text-blue-600\" />
              <div className=\"ml-4\">
                <p className=\"text-sm text-gray-500\">总学习次数</p>
                <p className=\"text-2xl font-semibold text-gray-900\">
                  {formatNumber(analyticsData.overview.totalSessions)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className=\"bg-white rounded-lg shadow p-6\"
          >
            <div className=\"flex items-center\">
              <ClockIcon className=\"h-8 w-8 text-green-600\" />
              <div className=\"ml-4\">
                <p className=\"text-sm text-gray-500\">总专注时长</p>
                <p className=\"text-2xl font-semibold text-gray-900\">
                  {formatTime(analyticsData.overview.totalFocusTime)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className=\"bg-white rounded-lg shadow p-6\"
          >
            <div className=\"flex items-center\">
              <CurrencyDollarIcon className=\"h-8 w-8 text-yellow-600\" />
              <div className=\"ml-4\">
                <p className=\"text-sm text-gray-500\">总获得金币</p>
                <p className=\"text-2xl font-semibold text-gray-900\">
                  {formatNumber(analyticsData.overview.totalCoinsEarned)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className=\"bg-white rounded-lg shadow p-6\"
          >
            <div className=\"flex items-center\">
              <StarIcon className=\"h-8 w-8 text-purple-600\" />
              <div className=\"ml-4\">
                <p className=\"text-sm text-gray-500\">学习效率</p>
                <p className={`text-2xl font-semibold ${getEfficiencyColor(analyticsData.overview.avgEfficiency)}`}>
                  {analyticsData.overview.avgEfficiency.toFixed(1)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className=\"bg-white rounded-lg shadow p-6\"
          >
            <div className=\"flex items-center\">
              <FireIcon className=\"h-8 w-8 text-red-600\" />
              <div className=\"ml-4\">
                <p className=\"text-sm text-gray-500\">学习连击</p>
                <p className=\"text-2xl font-semibold text-gray-900\">
                  {analyticsData.overview.studyStreak}天
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className=\"bg-white rounded-lg shadow p-6 mb-8\"
        >
          <h2 className=\"text-xl font-semibold text-gray-900 mb-6\">表现指标</h2>
          <div className=\"grid grid-cols-1 md:grid-cols-4 gap-6\">
            <div className=\"text-center\">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getPerformanceColor(analyticsData.performance.productivity)}`}>
                <span className=\"text-xl font-bold\">{Math.round(analyticsData.performance.productivity)}</span>
              </div>
              <p className=\"mt-2 text-sm text-gray-500\">生产力</p>
            </div>
            <div className=\"text-center\">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getPerformanceColor(analyticsData.performance.consistency)}`}>
                <span className=\"text-xl font-bold\">{Math.round(analyticsData.performance.consistency)}</span>
              </div>
              <p className=\"mt-2 text-sm text-gray-500\">一致性</p>
            </div>
            <div className=\"text-center\">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getPerformanceColor(50 + analyticsData.performance.improvement / 2)}`}>
                <span className=\"text-xl font-bold\">{analyticsData.performance.improvement > 0 ? '+' : ''}{Math.round(analyticsData.performance.improvement)}</span>
              </div>
              <p className=\"mt-2 text-sm text-gray-500\">改善度</p>
            </div>
            <div className=\"text-center\">
              {comparativeData && (
                <>
                  <div className=\"inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 text-indigo-600\">
                    <span className=\"text-xl font-bold\">#{comparativeData.userRank}</span>
                  </div>
                  <p className=\"mt-2 text-sm text-gray-500\">排名</p>
                </>
              )}
            </div>
          </div>
        </motion.div>

        <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8\">
          {/* Subject Analysis */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className=\"bg-white rounded-lg shadow p-6\"
          >
            <h2 className=\"text-xl font-semibold text-gray-900 mb-6\">学科分析</h2>
            <div className=\"space-y-4\">
              {analyticsData.subjects.slice(0, 5).map((subject, index) => (
                <div key={subject.subject} className=\"flex items-center justify-between p-4 bg-gray-50 rounded-lg\">
                  <div className=\"flex items-center space-x-4\">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className=\"font-medium text-gray-900\">{subject.subject}</p>
                      <p className=\"text-sm text-gray-500\">{subject.sessionCount} 次学习</p>
                    </div>
                  </div>
                  <div className=\"flex items-center space-x-2\">
                    <span className={`text-sm font-medium ${getEfficiencyColor(subject.efficiency)}`}>
                      {subject.efficiency.toFixed(1)}
                    </span>
                    {getTrendIcon(subject.trend)}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Insights and Recommendations */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className=\"space-y-6\"
          >
            {/* Insights */}
            <div className=\"bg-white rounded-lg shadow p-6\">
              <h2 className=\"text-xl font-semibold text-gray-900 mb-4\">学习洞察</h2>
              <div className=\"space-y-3\">
                {analyticsData.insights.slice(0, 3).map((insight, index) => (
                  <div key={index} className=\"flex items-start space-x-3 p-3 bg-blue-50 rounded-lg\">
                    <div className=\"w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0\" />
                    <p className=\"text-sm text-blue-800\">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className=\"bg-white rounded-lg shadow p-6\">
              <h2 className=\"text-xl font-semibold text-gray-900 mb-4\">改进建议</h2>
              <div className=\"space-y-3\">
                {analyticsData.recommendations.slice(0, 3).map((recommendation, index) => (
                  <div key={index} className=\"flex items-start space-x-3 p-3 bg-green-50 rounded-lg\">
                    <div className=\"w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0\" />
                    <p className=\"text-sm text-green-800\">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Comparative Analytics */}
        {comparativeData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className=\"bg-white rounded-lg shadow p-6\"
          >
            <h2 className=\"text-xl font-semibold text-gray-900 mb-6\">对比分析</h2>
            <div className=\"grid grid-cols-1 md:grid-cols-3 gap-6\">
              <div className=\"text-center p-4 border rounded-lg\">
                <h3 className=\"text-lg font-medium text-gray-900\">专注时间</h3>
                <div className=\"mt-2 space-y-1\">
                  <p className=\"text-2xl font-bold text-blue-600\">{formatTime(Math.round(comparativeData.comparisons.avgFocusTime.user))}</p>
                  <p className=\"text-sm text-gray-500\">平均: {formatTime(Math.round(comparativeData.comparisons.avgFocusTime.average))}</p>
                </div>
              </div>
              
              <div className=\"text-center p-4 border rounded-lg\">
                <h3 className=\"text-lg font-medium text-gray-900\">平均金币</h3>
                <div className=\"mt-2 space-y-1\">
                  <p className=\"text-2xl font-bold text-yellow-600\">{Math.round(comparativeData.comparisons.avgCoins.user)}</p>
                  <p className=\"text-sm text-gray-500\">平均: {Math.round(comparativeData.comparisons.avgCoins.average)}</p>
                </div>
              </div>
              
              <div className=\"text-center p-4 border rounded-lg\">
                <h3 className=\"text-lg font-medium text-gray-900\">学习连击</h3>
                <div className=\"mt-2 space-y-1\">
                  <p className=\"text-2xl font-bold text-red-600\">{comparativeData.comparisons.streak.user}天</p>
                  <p className=\"text-sm text-gray-500\">平均: {comparativeData.comparisons.streak.average}天</p>
                </div>
              </div>
            </div>
            
            <div className=\"mt-6 text-center\">
              <div className=\"inline-flex items-center space-x-2 px-4 py-2 bg-indigo-50 rounded-lg\">
                <TrophyIcon className=\"h-5 w-5 text-indigo-600\" />
                <span className=\"text-indigo-800 font-medium\">
                  您在所有用户中排名第 {comparativeData.userRank} 位，超过了 {comparativeData.percentile}% 的用户
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;