import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AnalyticsService } from '../src/services/AnalyticsService';
import db from '../src/config/database';

// Mock the database
jest.mock('../src/config/database');
const mockDb = db as jest.Mocked<typeof db>;

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock database queries
    mockDb.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      first: jest.fn(),
      leftJoin: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sum: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
      avg: jest.fn().mockReturnThis(),
      raw: jest.fn(),
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getUserAnalytics', () => {
    test('should return comprehensive analytics data', async () => {
      const userId = 'test-user';
      const period = '30d';

      // Mock overview metrics
      mockDb().first.mockResolvedValueOnce({
        total_sessions: '15',
        total_focus_time: '600',
        total_coins_earned: '750',
        avg_efficiency: '45.5',
      });

      // Mock study streak
      mockDb().select.mockReturnThis();
      mockDb().groupBy.mockReturnThis();
      mockDb().orderBy.mockReturnThis();
      mockDb().limit.mockResolvedValueOnce([
        { session_date: '2024-01-15' },
        { session_date: '2024-01-14' },
        { session_date: '2024-01-13' },
      ]);

      // Mock trends data
      mockDb().select.mockReturnThis();
      mockDb().where.mockReturnThis();
      mockDb().groupBy.mockReturnThis();
      mockDb().orderBy.mockResolvedValueOnce([
        {
          date: '2024-01-15',
          sessions: '3',
          focus_time: '120',
          coins: '150',
          efficiency: '50.0',
        },
        {
          date: '2024-01-14',
          sessions: '2',
          focus_time: '90',
          coins: '100',
          efficiency: '40.0',
        },
      ]);

      // Mock subject analysis
      mockDb().leftJoin.mockReturnThis();
      mockDb().select.mockReturnThis();
      mockDb().where.mockReturnThis();
      mockDb().groupBy.mockReturnThis();
      mockDb().orderBy.mockResolvedValueOnce([
        {
          subject: 'Mathematics',
          session_count: '8',
          total_focus_time: '320',
          total_coins: '400',
          avg_session_time: '40',
          efficiency: '50.0',
        },
        {
          subject: 'Physics',
          session_count: '7',
          total_focus_time: '280',
          total_coins: '350',
          avg_session_time: '40',
          efficiency: '45.0',
        },
      ]);

      // Mock performance metrics
      mockDb().first.mockResolvedValueOnce({
        avg_daily_focus: '40',
        avg_daily_coins: '50',
        active_days: '15',
      });

      // Mock trend calculations for subjects
      mockDb().leftJoin.mockReturnThis();
      mockDb().where.mockReturnThis();
      mockDb().avg.mockReturnThis();
      mockDb().first
        .mockResolvedValueOnce({ avg_coins: '48' }) // First half
        .mockResolvedValueOnce({ avg_coins: '52' }) // Second half
        .mockResolvedValueOnce({ avg_coins: '43' }) // Physics first half
        .mockResolvedValueOnce({ avg_coins: '47' }); // Physics second half

      // Mock improvement calculation
      mockDb().where.mockReturnThis();
      mockDb().avg.mockReturnThis();
      mockDb().first
        .mockResolvedValueOnce({ avg_coins: '50' }) // Current period
        .mockResolvedValueOnce({ avg_coins: '45' }); // Previous period

      const analytics = await AnalyticsService.getUserAnalytics(userId, period);

      expect(analytics).toBeDefined();
      expect(analytics.overview.totalSessions).toBe(15);
      expect(analytics.overview.totalFocusTime).toBe(600);
      expect(analytics.overview.totalCoinsEarned).toBe(750);
      expect(analytics.overview.studyStreak).toBe(3);
      expect(analytics.trends).toHaveLength(30); // 30 days of data
      expect(analytics.subjects).toHaveLength(2);
      expect(analytics.performance).toBeDefined();
      expect(analytics.recommendations).toBeDefined();
      expect(analytics.insights).toBeDefined();
    });

    test('should handle different time periods', async () => {
      const userId = 'test-user';
      
      // Test with 7d period
      mockDb().first.mockResolvedValueOnce({
        total_sessions: '7',
        total_focus_time: '210',
        total_coins_earned: '280',
        avg_efficiency: '40.0',
      });

      mockDb().select.mockReturnThis();
      mockDb().groupBy.mockReturnThis();
      mockDb().orderBy.mockReturnThis();
      mockDb().limit.mockResolvedValueOnce([]);

      mockDb().select.mockReturnThis();
      mockDb().where.mockReturnThis();
      mockDb().groupBy.mockReturnThis();
      mockDb().orderBy.mockResolvedValueOnce([]);

      mockDb().leftJoin.mockReturnThis();
      mockDb().select.mockReturnThis();
      mockDb().where.mockReturnThis();
      mockDb().groupBy.mockReturnThis();
      mockDb().orderBy.mockResolvedValueOnce([]);

      mockDb().first.mockResolvedValueOnce({
        avg_daily_focus: '30',
        avg_daily_coins: '40',
        active_days: '7',
      });

      mockDb().where.mockReturnThis();
      mockDb().avg.mockReturnThis();
      mockDb().first
        .mockResolvedValueOnce({ avg_coins: '40' }) // Current
        .mockResolvedValueOnce({ avg_coins: '35' }); // Previous

      const analytics = await AnalyticsService.getUserAnalytics(userId, '7d');

      expect(analytics.trends).toHaveLength(7); // 7 days of data
      expect(analytics.overview.totalSessions).toBe(7);
    });
  });

  describe('getComparativeAnalytics', () => {
    test('should return user ranking and comparisons', async () => {
      const userId = 'test-user';

      // Mock user stats
      mockDb().first.mockResolvedValueOnce({
        avg_focus: '45',
        avg_coins: '55',
        active_days: '20',
      });

      // Mock study streak
      mockDb().select.mockReturnThis();
      mockDb().groupBy.mockReturnThis();
      mockDb().orderBy.mockReturnThis();
      mockDb().limit.mockResolvedValueOnce([
        { session_date: '2024-01-15' },
        { session_date: '2024-01-14' },
      ]);

      // Mock global stats
      mockDb().first.mockResolvedValueOnce({
        avg_focus: '35',
        avg_coins: '40',
      });

      // Mock user ranking
      mockDb().select.mockReturnThis();
      mockDb().sum.mockReturnThis();
      mockDb().groupBy.mockReturnThis();
      mockDb().orderBy.mockResolvedValueOnce([
        { user_id: 'user1', total_coins: '1000' },
        { user_id: 'test-user', total_coins: '750' },
        { user_id: 'user3', total_coins: '600' },
        { user_id: 'user4', total_coins: '500' },
      ]);

      const comparative = await AnalyticsService.getComparativeAnalytics(userId);

      expect(comparative.userRank).toBe(2);
      expect(comparative.totalUsers).toBe(4);
      expect(comparative.percentile).toBe(75); // (4-2+1)/4 * 100
      expect(comparative.comparisons.avgFocusTime.user).toBe(45);
      expect(comparative.comparisons.avgFocusTime.average).toBe(35);
      expect(comparative.comparisons.avgCoins.user).toBe(55);
      expect(comparative.comparisons.avgCoins.average).toBe(40);
      expect(comparative.comparisons.streak.user).toBe(2);
    });

    test('should handle user not in ranking', async () => {
      const userId = 'new-user';

      // Mock user stats (no data)
      mockDb().first.mockResolvedValueOnce({
        avg_focus: '0',
        avg_coins: '0',
        active_days: '0',
      });

      // Mock study streak (no data)
      mockDb().select.mockReturnThis();
      mockDb().groupBy.mockReturnThis();
      mockDb().orderBy.mockReturnThis();
      mockDb().limit.mockResolvedValueOnce([]);

      // Mock global stats
      mockDb().first.mockResolvedValueOnce({
        avg_focus: '35',
        avg_coins: '40',
      });

      // Mock user ranking (user not found)
      mockDb().select.mockReturnThis();
      mockDb().sum.mockReturnThis();
      mockDb().groupBy.mockReturnThis();
      mockDb().orderBy.mockResolvedValueOnce([
        { user_id: 'user1', total_coins: '1000' },
        { user_id: 'user2', total_coins: '750' },
      ]);

      const comparative = await AnalyticsService.getComparativeAnalytics(userId);

      expect(comparative.userRank).toBe(3); // totalUsers + 1
      expect(comparative.totalUsers).toBe(2);
      expect(comparative.percentile).toBe(0);
    });
  });

  describe('exportUserData', () => {
    test('should export user data in JSON format', async () => {
      const userId = 'test-user';

      // Mock sessions data
      mockDb().leftJoin.mockReturnThis();
      mockDb().where.mockReturnThis();
      mockDb().select.mockReturnThis();
      mockDb().orderBy.mockResolvedValueOnce([
        {
          session_id: 'session1',
          session_date: '2024-01-15',
          focus_time_minutes: 60,
          total_coins: 75,
          task_name: 'Math Practice',
          subject: 'Mathematics',
          difficulty: 'Medium',
        },
      ]);

      // Mock coin history
      mockDb().where.mockReturnThis();
      mockDb().orderBy.mockResolvedValueOnce([
        {
          ledger_id: 'ledger1',
          amount: 75,
          change_type: 'earned',
          description: 'Learning session completed',
          created_at: '2024-01-15T10:00:00Z',
        },
      ]);

      // Mock achievements
      mockDb().leftJoin.mockReturnThis();
      mockDb().where.mockReturnThis();
      mockDb().select.mockResolvedValueOnce([
        {
          achievement_id: 'ach1',
          earned_at: '2024-01-15T10:30:00Z',
          name: 'First Steps',
          description: 'Complete your first learning session',
          points: 50,
        },
      ]);

      // Mock redemptions
      mockDb().leftJoin.mockReturnThis();
      mockDb().where.mockReturnThis();
      mockDb().select.mockResolvedValueOnce([
        {
          redemption_id: 'red1',
          redeemed_at: '2024-01-15T11:00:00Z',
          coins_spent: 50,
          reward_name: 'Coffee Break',
        },
      ]);

      const exportData = await AnalyticsService.exportUserData(userId, 'json');

      expect(exportData).toBeDefined();
      expect(exportData.userId).toBe(userId);
      expect(exportData.sessions).toHaveLength(1);
      expect(exportData.coinHistory).toHaveLength(1);
      expect(exportData.achievements).toHaveLength(1);
      expect(exportData.redemptions).toHaveLength(1);
      expect(exportData.exportedAt).toBeTruthy();
    });

    test('should export user data in CSV format', async () => {
      const userId = 'test-user';

      // Mock sessions data
      const mockSessions = [
        {
          session_id: 'session1',
          session_date: '2024-01-15',
          focus_time_minutes: 60,
          total_coins: 75,
        },
      ];

      mockDb().leftJoin.mockReturnThis();
      mockDb().where.mockReturnThis();
      mockDb().select.mockReturnThis();
      mockDb().orderBy.mockResolvedValueOnce(mockSessions);

      // Mock other data as empty arrays
      mockDb().where.mockReturnThis();
      mockDb().orderBy.mockResolvedValueOnce([]);

      mockDb().leftJoin.mockReturnThis();
      mockDb().where.mockReturnThis();
      mockDb().select
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const exportData = await AnalyticsService.exportUserData(userId, 'csv');

      expect(exportData.sessions).toContain('session_id,session_date,focus_time_minutes,total_coins');
      expect(exportData.sessions).toContain('"session1","2024-01-15","60","75"');
    });
  });

  describe('private helper methods', () => {
    test('parsePeriod should convert period strings correctly', () => {
      // This tests the private parsePeriod method indirectly through getUserAnalytics
      expect(() => AnalyticsService['parsePeriod']('7d')).not.toThrow();
      expect(() => AnalyticsService['parsePeriod']('30d')).not.toThrow();
      expect(() => AnalyticsService['parsePeriod']('12w')).not.toThrow();
      expect(() => AnalyticsService['parsePeriod']('6m')).not.toThrow();
      expect(() => AnalyticsService['parsePeriod']('1y')).not.toThrow();
    });

    test('calculateProductivityScore should calculate scores correctly', () => {
      const score1 = AnalyticsService['calculateProductivityScore'](60, 30); // 1 hour, 30 coins
      const score2 = AnalyticsService['calculateProductivityScore'](120, 50); // 2 hours, 50 coins
      const score3 = AnalyticsService['calculateProductivityScore'](30, 15); // 30 min, 15 coins

      expect(score1).toBeGreaterThan(0);
      expect(score1).toBeLessThanOrEqual(100);
      expect(score2).toBeGreaterThan(score1); // Better performance
      expect(score3).toBeLessThan(score1); // Worse performance
    });

    test('convertToCSV should format data correctly', () => {
      const data = [
        { id: 1, name: 'Test', value: 100 },
        { id: 2, name: 'Test 2', value: 200 },
      ];

      const csv = AnalyticsService['convertToCSV'](data);

      expect(csv).toContain('id,name,value');
      expect(csv).toContain('"1","Test","100"');
      expect(csv).toContain('"2","Test 2","200"');
    });

    test('convertToCSV should handle empty data', () => {
      const csv = AnalyticsService['convertToCSV']([]);
      expect(csv).toBe('');
    });
  });
});