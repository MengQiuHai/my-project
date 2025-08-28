import { Request, Response } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';
import { ResponseHelper } from '../utils/response';
import { AuthRequest } from '../types';

export class AnalyticsController {
  /**
   * Get comprehensive user analytics
   */
  static async getUserAnalytics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.user_id;
      const period = (req.query.period as string) || '30d';

      const analytics = await AnalyticsService.getUserAnalytics(userId, period);

      ResponseHelper.success(res, analytics, 'Analytics retrieved successfully');
    } catch (error: any) {
      console.error('Get user analytics error:', error);
      ResponseHelper.error(res, error.message, 500);
    }
  }

  /**
   * Get learning trends
   */
  static async getLearningTrends(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.user_id;
      const period = (req.query.period as string) || '30d';

      const analytics = await AnalyticsService.getUserAnalytics(userId, period);

      ResponseHelper.success(res, {
        trends: analytics.trends,
        period,
      }, 'Learning trends retrieved successfully');
    } catch (error: any) {
      console.error('Get learning trends error:', error);
      ResponseHelper.error(res, error.message, 500);
    }
  }

  /**
   * Get subject analysis
   */
  static async getSubjectAnalysis(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.user_id;
      const period = (req.query.period as string) || '30d';

      const analytics = await AnalyticsService.getUserAnalytics(userId, period);

      ResponseHelper.success(res, {
        subjects: analytics.subjects,
        period,
      }, 'Subject analysis retrieved successfully');
    } catch (error: any) {
      console.error('Get subject analysis error:', error);
      ResponseHelper.error(res, error.message, 500);
    }
  }

  /**
   * Get performance metrics
   */
  static async getPerformanceMetrics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.user_id;
      const period = (req.query.period as string) || '30d';

      const analytics = await AnalyticsService.getUserAnalytics(userId, period);

      ResponseHelper.success(res, {
        performance: analytics.performance,
        overview: analytics.overview,
        period,
      }, 'Performance metrics retrieved successfully');
    } catch (error: any) {
      console.error('Get performance metrics error:', error);
      ResponseHelper.error(res, error.message, 500);
    }
  }

  /**
   * Get comparative analytics
   */
  static async getComparativeAnalytics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.user_id;

      const comparativeData = await AnalyticsService.getComparativeAnalytics(userId);

      ResponseHelper.success(res, comparativeData, 'Comparative analytics retrieved successfully');
    } catch (error: any) {
      console.error('Get comparative analytics error:', error);
      ResponseHelper.error(res, error.message, 500);
    }
  }

  /**
   * Get personalized recommendations
   */
  static async getRecommendations(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.user_id;
      const period = (req.query.period as string) || '30d';

      const analytics = await AnalyticsService.getUserAnalytics(userId, period);

      ResponseHelper.success(res, {
        recommendations: analytics.recommendations,
        insights: analytics.insights,
        period,
      }, 'Recommendations retrieved successfully');
    } catch (error: any) {
      console.error('Get recommendations error:', error);
      ResponseHelper.error(res, error.message, 500);
    }
  }

  /**
   * Export user data
   */
  static async exportUserData(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.user_id;
      const format = (req.query.format as 'csv' | 'json') || 'json';

      const exportData = await AnalyticsService.exportUserData(userId, format);

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=growth-bank-data-${userId}-${Date.now()}.csv`);
        
        // For CSV, we'll return the sessions data as the main export
        res.send(exportData.sessions);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=growth-bank-data-${userId}-${Date.now()}.json`);
        
        ResponseHelper.success(res, exportData, 'Data exported successfully');
      }
    } catch (error: any) {
      console.error('Export user data error:', error);
      ResponseHelper.error(res, error.message, 500);
    }
  }

  /**
   * Get dashboard summary
   */
  static async getDashboardSummary(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.user_id;

      const [analytics, comparative] = await Promise.all([
        AnalyticsService.getUserAnalytics(userId, '7d'), // Last 7 days for dashboard
        AnalyticsService.getComparativeAnalytics(userId),
      ]);

      const summary = {
        overview: analytics.overview,
        performance: analytics.performance,
        recentTrends: analytics.trends.slice(-7), // Last 7 days
        topSubjects: analytics.subjects.slice(0, 3), // Top 3 subjects
        ranking: {
          position: comparative.userRank,
          percentile: comparative.percentile,
          totalUsers: comparative.totalUsers,
        },
        quickInsights: analytics.insights.slice(0, 3), // Top 3 insights
        urgentRecommendations: analytics.recommendations.slice(0, 2), // Top 2 recommendations
      };

      ResponseHelper.success(res, summary, 'Dashboard summary retrieved successfully');
    } catch (error: any) {
      console.error('Get dashboard summary error:', error);
      ResponseHelper.error(res, error.message, 500);
    }
  }

  /**
   * Get detailed learning report
   */
  static async getDetailedReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.user_id;
      const period = (req.query.period as string) || '30d';
      const includeComparative = req.query.includeComparative === 'true';

      const analytics = await AnalyticsService.getUserAnalytics(userId, period);
      
      let comparative = null;
      if (includeComparative) {
        comparative = await AnalyticsService.getComparativeAnalytics(userId);
      }

      const report = {
        ...analytics,
        comparative,
        generatedAt: new Date().toISOString(),
        period,
      };

      ResponseHelper.success(res, report, 'Detailed report generated successfully');
    } catch (error: any) {
      console.error('Get detailed report error:', error);
      ResponseHelper.error(res, error.message, 500);
    }
  }

  /**
   * Get learning statistics by date range
   */
  static async getStatsByDateRange(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.user_id;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        ResponseHelper.error(res, 'Start date and end date are required', 400);
        return;
      }

      // Calculate period in days
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const period = `${diffDays}d`;
      const analytics = await AnalyticsService.getUserAnalytics(userId, period);

      // Filter trends by date range
      const filteredTrends = analytics.trends.filter(trend => {
        const trendDate = new Date(trend.date);
        return trendDate >= start && trendDate <= end;
      });

      ResponseHelper.success(res, {
        ...analytics,
        trends: filteredTrends,
        dateRange: {
          startDate: startDate as string,
          endDate: endDate as string,
          totalDays: diffDays,
        },
      }, 'Statistics by date range retrieved successfully');
    } catch (error: any) {
      console.error('Get stats by date range error:', error);
      ResponseHelper.error(res, error.message, 500);
    }
  }
}