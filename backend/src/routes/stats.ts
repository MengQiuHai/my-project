import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { AnalyticsController } from '../controllers/AnalyticsController';

const router = express.Router();

// Dashboard summary - quick overview for main dashboard
router.get('/dashboard', authenticateToken, AnalyticsController.getDashboardSummary);

// Comprehensive analytics - full report with all metrics
router.get('/analytics', authenticateToken, AnalyticsController.getUserAnalytics);

// Detailed report - comprehensive report with optional comparative data
router.get('/report', authenticateToken, AnalyticsController.getDetailedReport);

// Learning trends - progress over time
router.get('/trends', authenticateToken, AnalyticsController.getLearningTrends);

// Subject analysis - performance by subject
router.get('/subjects', authenticateToken, AnalyticsController.getSubjectAnalysis);

// Performance metrics - key performance indicators
router.get('/performance', authenticateToken, AnalyticsController.getPerformanceMetrics);

// Comparative analytics - user ranking and comparisons
router.get('/comparative', authenticateToken, AnalyticsController.getComparativeAnalytics);

// Personalized recommendations and insights
router.get('/recommendations', authenticateToken, AnalyticsController.getRecommendations);

// Statistics by custom date range
router.get('/date-range', authenticateToken, AnalyticsController.getStatsByDateRange);

// Data export - export user data in JSON or CSV format
router.get('/export', authenticateToken, AnalyticsController.exportUserData);

export default router;