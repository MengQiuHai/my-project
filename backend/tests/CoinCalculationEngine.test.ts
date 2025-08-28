import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { CoinCalculationEngine, CoinCalculationInput, CoinCalculationResult } from '../src/services/CoinCalculationEngine';
import db from '../src/config/database';

// Mock the database
jest.mock('../src/config/database');
const mockDb = db as jest.Mocked<typeof db>;

describe('CoinCalculationEngine', () => {
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
      sum: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('calculateCoins', () => {
    test('should calculate basic coins correctly', async () => {
      const input: CoinCalculationInput = {
        userId: 'test-user-id',
        taskId: 'test-task-id',
        difficultyId: 'easy-difficulty',
        focusTimeMinutes: 60,
        resultQuantity: 10,
        sessionDate: '2024-01-15',
      };

      // Mock task definition
      mockDb().first.mockResolvedValueOnce({
        task_id: 'test-task-id',
        name: 'Test Task',
        base_coin: 5,
        subject: 'Mathematics',
        task_type: 'practice',
      });

      // Mock difficulty
      mockDb().first.mockResolvedValueOnce({
        difficulty_id: 'easy-difficulty',
        label: 'Easy',
        coefficient: 1.0,
      });

      // Mock no existing sessions for bonus calculation
      mockDb().first.mockResolvedValueOnce(null);

      const result = await CoinCalculationEngine.calculateCoins(input);

      expect(result).toBeDefined();
      expect(result.totalCoins).toBeGreaterThan(0);
      expect(result.breakdown.focusCoins).toBeGreaterThan(0);
      expect(result.breakdown.resultCoins).toBeGreaterThan(0);
      expect(result.breakdown.totalBonus).toBeGreaterThanOrEqual(0);
    });

    test('should apply difficulty coefficient correctly', async () => {
      const baseInput: CoinCalculationInput = {
        userId: 'test-user-id',
        taskId: 'test-task-id',
        difficultyId: 'easy-difficulty',
        focusTimeMinutes: 60,
        resultQuantity: 10,
        sessionDate: '2024-01-15',
      };

      const hardInput: CoinCalculationInput = {
        ...baseInput,
        difficultyId: 'hard-difficulty',
      };

      // Mock task definition
      const mockTask = {
        task_id: 'test-task-id',
        name: 'Test Task',
        base_coin: 5,
        subject: 'Mathematics',
        task_type: 'practice',
      };

      mockDb().first
        .mockResolvedValueOnce(mockTask) // Easy task
        .mockResolvedValueOnce({
          difficulty_id: 'easy-difficulty',
          label: 'Easy',
          coefficient: 1.0,
        }) // Easy difficulty
        .mockResolvedValueOnce(null) // No existing sessions
        .mockResolvedValueOnce(mockTask) // Hard task
        .mockResolvedValueOnce({
          difficulty_id: 'hard-difficulty',
          label: 'Hard',
          coefficient: 2.0,
        }) // Hard difficulty
        .mockResolvedValueOnce(null); // No existing sessions

      const [easyResult, hardResult] = await Promise.all([
        CoinCalculationEngine.calculateCoins(baseInput),
        CoinCalculationEngine.calculateCoins(hardInput),
      ]);

      expect(hardResult.breakdown.resultCoins).toBeGreaterThan(easyResult.breakdown.resultCoins);
    });

    test('should calculate focus coins with tiered rates', async () => {
      const shortSession: CoinCalculationInput = {
        userId: 'test-user-id',
        taskId: 'test-task-id',
        difficultyId: 'easy-difficulty',
        focusTimeMinutes: 15,
        resultQuantity: 5,
        sessionDate: '2024-01-15',
      };

      const longSession: CoinCalculationInput = {
        ...shortSession,
        focusTimeMinutes: 120, // 2 hours
      };

      // Mock task and difficulty for both
      mockDb().first
        .mockResolvedValueOnce({
          task_id: 'test-task-id',
          name: 'Test Task',
          base_coin: 5,
          subject: 'Mathematics',
          task_type: 'practice',
        })
        .mockResolvedValueOnce({
          difficulty_id: 'easy-difficulty',
          label: 'Easy',
          coefficient: 1.0,
        })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          task_id: 'test-task-id',
          name: 'Test Task',
          base_coin: 5,
          subject: 'Mathematics',
          task_type: 'practice',
        })
        .mockResolvedValueOnce({
          difficulty_id: 'easy-difficulty',
          label: 'Easy',
          coefficient: 1.0,
        })
        .mockResolvedValueOnce(null);

      const [shortResult, longResult] = await Promise.all([
        CoinCalculationEngine.calculateCoins(shortSession),
        CoinCalculationEngine.calculateCoins(longSession),
      ]);

      // Long sessions should get more focus coins due to tiered rates
      expect(longResult.breakdown.focusCoins).toBeGreaterThan(shortResult.breakdown.focusCoins * 4);
    });

    test('should apply streak bonus correctly', async () => {
      const input: CoinCalculationInput = {
        userId: 'test-user-id',
        taskId: 'test-task-id',
        difficultyId: 'easy-difficulty',
        focusTimeMinutes: 60,
        resultQuantity: 10,
        sessionDate: '2024-01-15',
      };

      // Mock task definition
      mockDb().first.mockResolvedValueOnce({
        task_id: 'test-task-id',
        name: 'Test Task',
        base_coin: 5,
        subject: 'Mathematics',
        task_type: 'practice',
      });

      // Mock difficulty
      mockDb().first.mockResolvedValueOnce({
        difficulty_id: 'easy-difficulty',
        label: 'Easy',
        coefficient: 1.0,
      });

      // Mock 5-day streak (should trigger streak bonus)
      mockDb().first.mockResolvedValueOnce({
        streak_days: 5,
      });

      const result = await CoinCalculationEngine.calculateCoins(input);

      expect(result.breakdown.bonusBreakdown.streakBonus).toBeGreaterThan(0);
      expect(result.breakdown.totalBonus).toBeGreaterThan(0);
    });

    test('should apply first attempt bonus', async () => {
      const input: CoinCalculationInput = {
        userId: 'test-user-id',
        taskId: 'test-task-id',
        difficultyId: 'easy-difficulty',
        focusTimeMinutes: 60,
        resultQuantity: 10,
        sessionDate: '2024-01-15',
      };

      // Mock task definition
      mockDb().first.mockResolvedValueOnce({
        task_id: 'test-task-id',
        name: 'Test Task',
        base_coin: 5,
        subject: 'Mathematics',
        task_type: 'practice',
      });

      // Mock difficulty
      mockDb().first.mockResolvedValueOnce({
        difficulty_id: 'easy-difficulty',
        label: 'Easy',
        coefficient: 1.0,
      });

      // Mock no existing sessions (first attempt)
      mockDb().first.mockResolvedValueOnce(null);

      const result = await CoinCalculationEngine.calculateCoins(input);

      expect(result.breakdown.bonusBreakdown.firstAttemptBonus).toBeGreaterThan(0);
    });

    test('should handle invalid input gracefully', async () => {
      const invalidInput: CoinCalculationInput = {
        userId: '',
        taskId: 'invalid-task',
        difficultyId: 'invalid-difficulty',
        focusTimeMinutes: -10,
        resultQuantity: -5,
        sessionDate: 'invalid-date',
      };

      // Mock task not found
      mockDb().first.mockResolvedValueOnce(null);

      await expect(CoinCalculationEngine.calculateCoins(invalidInput)).rejects.toThrow();
    });
  });

  describe('recordCoinTransaction', () => {
    test('should record transaction and update user balance', async () => {
      const userId = 'test-user-id';
      const amount = 50;
      const changeType = 'earned';
      const sourceType = 'learning_session';
      const referenceId = 'session-123';
      const description = 'Test transaction';

      // Mock current balance
      mockDb().first.mockResolvedValueOnce({
        current_coins: 100,
      });

      // Mock successful insert
      mockDb().insert.mockResolvedValueOnce([{ ledger_id: 'new-ledger-id' }]);

      // Mock successful update
      mockDb().where.mockReturnThis();
      mockDb().update = jest.fn().mockResolvedValueOnce(1);

      await CoinCalculationEngine.recordCoinTransaction(
        userId,
        amount,
        changeType,
        sourceType,
        referenceId,
        description
      );

      expect(mockDb().insert).toHaveBeenCalled();
    });

    test('should handle insufficient balance for negative transactions', async () => {
      const userId = 'test-user-id';
      const amount = -150; // More than current balance
      const changeType = 'spent';

      // Mock current balance of 100
      mockDb().first.mockResolvedValueOnce({
        current_coins: 100,
      });

      await expect(
        CoinCalculationEngine.recordCoinTransaction(
          userId,
          amount,
          changeType,
          'reward_redemption',
          'reward-123',
          'Test spending'
        )
      ).rejects.toThrow('Insufficient coin balance');
    });
  });

  describe('getUserCoinBalance', () => {
    test('should return current user balance', async () => {
      const userId = 'test-user-id';
      const expectedBalance = 250;

      mockDb().first.mockResolvedValueOnce({
        current_coins: expectedBalance,
      });

      const balance = await CoinCalculationEngine.getUserCoinBalance(userId);

      expect(balance).toBe(expectedBalance);
    });

    test('should return 0 for user not found', async () => {
      const userId = 'non-existent-user';

      mockDb().first.mockResolvedValueOnce(null);

      const balance = await CoinCalculationEngine.getUserCoinBalance(userId);

      expect(balance).toBe(0);
    });
  });

  describe('getCoinHistory', () => {
    test('should return paginated coin history', async () => {
      const userId = 'test-user-id';
      const mockHistory = [
        {
          ledger_id: '1',
          amount: 50,
          change_type: 'earned',
          description: 'Learning session completed',
          created_at: '2024-01-15T10:00:00Z',
        },
        {
          ledger_id: '2',
          amount: -20,
          change_type: 'spent',
          description: 'Reward redeemed',
          created_at: '2024-01-15T11:00:00Z',
        },
      ];

      mockDb().orderBy.mockReturnThis();
      mockDb().limit.mockReturnThis();
      mockDb().offset.mockResolvedValueOnce(mockHistory);
      mockDb().count.mockResolvedValueOnce([{ count: '2' }]);

      const result = await CoinCalculationEngine.getCoinHistory(userId, { limit: 10, offset: 0 });

      expect(result.records).toEqual(mockHistory);
      expect(result.total).toBe(2);
    });
  });
});