import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { CoinDecayService, DecayRule } from '../src/services/CoinDecayService';
import db from '../src/config/database';
import { CoinCalculationEngine } from '../src/services/CoinCalculationEngine';

// Mock dependencies
jest.mock('../src/config/database');
jest.mock('../src/services/CoinCalculationEngine');
jest.mock('node-cron');

const mockDb = db as jest.Mocked<typeof db>;
const mockCoinEngine = CoinCalculationEngine as jest.Mocked<typeof CoinCalculationEngine>;

describe('CoinDecayService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock database queries
    mockDb.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      first: jest.fn(),
      insert: jest.fn(),
      leftJoin: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      whereExists: jest.fn().mockReturnThis(),
      orWhereExists: jest.fn().mockReturnThis(),
      whereRaw: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('executeDecayProcess', () => {
    test('should process decay for all active users', async () => {
      const mockUsers = [
        { user_id: 'user1' },
        { user_id: 'user2' },
      ];

      const mockDecayRules: DecayRule[] = [
        {
          rule_id: 'rule1',
          name: 'Basic Decay',
          threshold_days: 7,
          decay_rate: 0.1,
          decay_type: 'percentage',
          applies_to: 'all',
          is_active: true,
          priority: 1,
        },
      ];

      // Mock getActiveUsers
      mockDb().select.mockReturnThis();
      mockDb().where.mockReturnThis();
      mockDb().orWhereExists.mockResolvedValueOnce(mockUsers);

      // Mock getActiveDecayRules
      mockDb().where.mockReturnThis();
      mockDb().orderBy.mockResolvedValueOnce(mockDecayRules);

      // Mock getUserSessionsForDecay (empty sessions for simplicity)
      mockDb().leftJoin.mockReturnThis();
      mockDb().select.mockReturnThis();
      mockDb().where.mockReturnThis();
      mockDb().where.mockResolvedValueOnce([]);

      await CoinDecayService.executeDecayProcess();

      // Verify that the process ran without errors
      expect(mockDb().where).toHaveBeenCalled();
    });
  });

  describe('processUserDecay', () => {
    test('should apply decay to eligible sessions', async () => {
      const userId = 'test-user';
      const mockDecayRules: DecayRule[] = [
        {
          rule_id: 'rule1',
          name: 'Weekly Decay',
          threshold_days: 7,
          decay_rate: 0.15,
          decay_type: 'percentage',
          applies_to: 'all',
          is_active: true,
          priority: 1,
        },
      ];

      const mockSessions = [
        {
          session_id: 'session1',
          session_date: '2024-01-01', // 14+ days ago
          total_coins: 100,
          subject: 'Mathematics',
          task_type: 'practice',
        },
        {
          session_id: 'session2',
          session_date: '2024-01-10', // 5 days ago (not eligible)
          total_coins: 50,
          subject: 'Physics',
          task_type: 'exercise',
        },
      ];

      // Mock getUserSessionsForDecay
      mockDb().leftJoin.mockReturnThis();
      mockDb().select.mockReturnThis();
      mockDb().where.mockReturnThis();
      mockDb().where.mockResolvedValueOnce(mockSessions);

      // Mock no existing decay records
      mockDb().where.mockReturnThis();
      mockDb().whereRaw.mockResolvedValue(null);

      // Mock CoinCalculationEngine.recordCoinTransaction
      mockCoinEngine.recordCoinTransaction.mockResolvedValue(undefined);

      await CoinDecayService.processUserDecay(userId, mockDecayRules);

      // Should call recordCoinTransaction for the eligible session
      expect(mockCoinEngine.recordCoinTransaction).toHaveBeenCalledWith(
        userId,
        -15, // 15% of 100 coins
        'decayed',
        'session_decay',
        'session1',
        expect.stringContaining('Weekly Decay'),
        expect.any(Object)
      );
    });

    test('should not apply decay to sessions already decayed', async () => {
      const userId = 'test-user';
      const mockDecayRules: DecayRule[] = [
        {
          rule_id: 'rule1',
          name: 'Daily Decay',
          threshold_days: 1,
          decay_rate: 10,
          decay_type: 'fixed',
          applies_to: 'all',
          is_active: true,
          priority: 1,
        },
      ];

      const mockSessions = [
        {
          session_id: 'session1',
          session_date: '2024-01-01',
          total_coins: 100,
          subject: 'Mathematics',
          task_type: 'practice',
        },
      ];

      // Mock getUserSessionsForDecay
      mockDb().leftJoin.mockReturnThis();
      mockDb().select.mockReturnThis();
      mockDb().where.mockReturnThis();
      mockDb().where.mockResolvedValueOnce(mockSessions);

      // Mock existing decay record (already decayed)
      mockDb().where.mockReturnThis();
      mockDb().whereRaw.mockResolvedValueOnce({
        ledger_id: 'existing-decay',
      });

      await CoinDecayService.processUserDecay(userId, mockDecayRules);

      // Should not call recordCoinTransaction since already decayed
      expect(mockCoinEngine.recordCoinTransaction).not.toHaveBeenCalled();
    });
  });

  describe('applyDecayToSession', () => {
    test('should apply percentage decay correctly', async () => {
      const userId = 'test-user';
      const session = {
        session_id: 'session1',
        session_date: '2024-01-01',
        total_coins: 100,
      };
      const rule: DecayRule = {
        rule_id: 'rule1',
        name: 'Percentage Decay',
        threshold_days: 7,
        decay_rate: 0.2, // 20%
        decay_type: 'percentage',
        applies_to: 'all',
        is_active: true,
        priority: 1,
      };

      // Mock no existing decay
      mockDb().where.mockReturnThis();
      mockDb().whereRaw.mockResolvedValueOnce(null);

      // Mock CoinCalculationEngine.recordCoinTransaction
      mockCoinEngine.recordCoinTransaction.mockResolvedValue(undefined);

      await CoinDecayService.applyDecayToSession(userId, session, rule);

      expect(mockCoinEngine.recordCoinTransaction).toHaveBeenCalledWith(
        userId,
        -20, // 20% of 100
        'decayed',
        'session_decay',
        'session1',
        expect.stringContaining('Percentage Decay'),
        expect.objectContaining({
          rule_id: 'rule1',
          decay_rate: 0.2,
          decay_type: 'percentage',
          original_coins: 100,
        })
      );
    });

    test('should apply fixed decay correctly', async () => {
      const userId = 'test-user';
      const session = {
        session_id: 'session1',
        session_date: '2024-01-01',
        total_coins: 100,
      };
      const rule: DecayRule = {
        rule_id: 'rule1',
        name: 'Fixed Decay',
        threshold_days: 7,
        decay_rate: 15, // Fixed 15 coins
        decay_type: 'fixed',
        applies_to: 'all',
        is_active: true,
        priority: 1,
      };

      // Mock no existing decay
      mockDb().where.mockReturnThis();
      mockDb().whereRaw.mockResolvedValueOnce(null);

      mockCoinEngine.recordCoinTransaction.mockResolvedValue(undefined);

      await CoinDecayService.applyDecayToSession(userId, session, rule);

      expect(mockCoinEngine.recordCoinTransaction).toHaveBeenCalledWith(
        userId,
        -15, // Fixed 15 coins
        'decayed',
        'session_decay',
        'session1',
        expect.stringContaining('Fixed Decay'),
        expect.objectContaining({
          rule_id: 'rule1',
          decay_rate: 15,
          decay_type: 'fixed',
        })
      );
    });

    test('should not decay more than session total coins', async () => {
      const userId = 'test-user';
      const session = {
        session_id: 'session1',
        session_date: '2024-01-01',
        total_coins: 10, // Small amount
      };
      const rule: DecayRule = {
        rule_id: 'rule1',
        name: 'Large Fixed Decay',
        threshold_days: 7,
        decay_rate: 50, // More than session coins
        decay_type: 'fixed',
        applies_to: 'all',
        is_active: true,
        priority: 1,
      };

      mockDb().where.mockReturnThis();
      mockDb().whereRaw.mockResolvedValueOnce(null);
      mockCoinEngine.recordCoinTransaction.mockResolvedValue(undefined);

      await CoinDecayService.applyDecayToSession(userId, session, rule);

      // Should only decay the session total (10), not the full rule amount (50)
      expect(mockCoinEngine.recordCoinTransaction).toHaveBeenCalledWith(
        userId,
        -10,
        'decayed',
        'session_decay',
        'session1',
        expect.any(String),
        expect.any(Object)
      );
    });
  });

  describe('getDecayHistory', () => {
    test('should return paginated decay history', async () => {
      const userId = 'test-user';
      const mockHistory = [
        {
          ledger_id: '1',
          amount: -15,
          change_type: 'decayed',
          description: 'Knowledge forgetting decay',
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      mockDb().where.mockReturnThis();
      mockDb().orderBy.mockReturnThis();
      mockDb().limit.mockReturnThis();
      mockDb().offset.mockResolvedValueOnce(mockHistory);
      
      mockDb().count.mockResolvedValueOnce([{ count: '1' }]);

      const result = await CoinDecayService.getDecayHistory(userId, { limit: 10, offset: 0 });

      expect(result.records).toEqual(mockHistory);
      expect(result.total).toBe(1);
    });
  });

  describe('getDecayStatistics', () => {
    test('should calculate decay statistics correctly', async () => {
      const userId = 'test-user';
      
      // Mock total decay data
      mockDb().where.mockReturnThis();
      mockDb().sum.mockReturnThis();
      mockDb().count.mockReturnThis();
      mockDb().first.mockResolvedValueOnce({
        total: '-45',
        count: '3',
      });

      // Mock decay by rule data
      mockDb().where.mockReturnThis();
      mockDb().select.mockReturnThis();
      mockDb().groupBy.mockResolvedValueOnce([
        {
          rule_id: 'rule1',
          amount: '30',
          count: '2',
        },
        {
          rule_id: 'rule2',
          amount: '15',
          count: '1',
        },
      ]);

      // Mock rule names
      mockDb().where.mockReturnThis();
      mockDb().select.mockReturnThis();
      mockDb().first
        .mockResolvedValueOnce({ name: 'Weekly Decay' })
        .mockResolvedValueOnce({ name: 'Monthly Decay' });

      const stats = await CoinDecayService.getDecayStatistics(userId, 30);

      expect(stats.totalDecayed).toBe(45);
      expect(stats.decayCount).toBe(3);
      expect(stats.avgDecayPerDay).toBeCloseTo(1.5);
      expect(stats.decayByRule).toHaveLength(2);
      expect(stats.decayByRule[0].ruleName).toBe('Weekly Decay');
      expect(stats.decayByRule[0].amount).toBe(30);
    });
  });

  describe('predictDecay', () => {
    test('should predict future decay correctly', async () => {
      const userId = 'test-user';
      
      const mockDecayRules: DecayRule[] = [
        {
          rule_id: 'rule1',
          name: 'Future Decay',
          threshold_days: 3,
          decay_rate: 0.1,
          decay_type: 'percentage',
          applies_to: 'all',
          is_active: true,
          priority: 1,
        },
      ];

      const mockSessions = [
        {
          session_id: 'session1',
          session_date: '2024-01-13', // Will be eligible in 1 day
          total_coins: 100,
          subject: 'Mathematics',
          task_type: 'practice',
        },
      ];

      // Mock getActiveDecayRules
      mockDb().where.mockReturnThis();
      mockDb().orderBy.mockResolvedValueOnce(mockDecayRules);

      // Mock getUserSessionsForDecay
      mockDb().leftJoin.mockReturnThis();
      mockDb().select.mockReturnThis();
      mockDb().where.mockReturnThis();
      mockDb().where.mockResolvedValueOnce(mockSessions);

      // Mock no existing decay
      mockDb().where.mockReturnThis();
      mockDb().whereRaw.mockResolvedValue(null);

      const predictions = await CoinDecayService.predictDecay(userId, 3);

      expect(predictions).toHaveLength(3);
      expect(predictions[0].predictedDecay).toBeGreaterThanOrEqual(0);
      expect(predictions[0].date).toBeTruthy();
    });
  });

  describe('triggerDecay', () => {
    test('should manually trigger decay for specific user', async () => {
      const userId = 'test-user';
      
      const mockDecayRules: DecayRule[] = [
        {
          rule_id: 'rule1',
          name: 'Manual Decay',
          threshold_days: 1,
          decay_rate: 0.05,
          decay_type: 'percentage',
          applies_to: 'all',
          is_active: true,
          priority: 1,
        },
      ];

      // Mock getActiveDecayRules
      mockDb().where.mockReturnThis();
      mockDb().orderBy.mockResolvedValueOnce(mockDecayRules);

      // Mock empty sessions
      mockDb().leftJoin.mockReturnThis();
      mockDb().select.mockReturnThis();
      mockDb().where.mockReturnThis();
      mockDb().where.mockResolvedValueOnce([]);

      await CoinDecayService.triggerDecay(userId);

      // Should complete without errors
      expect(mockDb().where).toHaveBeenCalled();
    });

    test('should trigger decay for all users when no userId specified', async () => {
      // Mock getActiveUsers
      mockDb().select.mockReturnThis();
      mockDb().where.mockReturnThis();
      mockDb().orWhereExists.mockResolvedValueOnce([]);

      // Mock getActiveDecayRules
      mockDb().where.mockReturnThis();
      mockDb().orderBy.mockResolvedValueOnce([]);

      await CoinDecayService.triggerDecay();

      // Should complete without errors
      expect(mockDb().where).toHaveBeenCalled();
    });
  });
});