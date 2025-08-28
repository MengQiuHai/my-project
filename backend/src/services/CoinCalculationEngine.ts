import db from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface CoinCalculationResult {
  focusCoins: number;
  resultCoins: number;
  totalCoins: number;
  bonusCoins?: number;
  calculations: {
    focusTime: number;
    focusRate: number;
    resultQuantity: number;
    baseCoin: number;
    difficultyCoefficient: number;
    bonuses?: Array<{
      type: string;
      amount: number;
      reason: string;
    }>;
  };
}

export interface CoinCalculationInput {
  userId: string;
  taskId: string;
  difficultyId: string;
  focusTimeMinutes: number;
  resultQuantity: number;
  sessionDate: string;
}

export class CoinCalculationEngine {
  // 基础金币计算规则
  private static readonly FOCUS_COIN_RATE = 30; // 每30分钟获得1枚专注金币
  private static readonly MIN_FOCUS_TIME = 5; // 最少专注时间（分钟）

  /**
   * 计算学习会话的金币奖励
   */
  static async calculateCoins(input: CoinCalculationInput): Promise<CoinCalculationResult> {
    const { userId, taskId, difficultyId, focusTimeMinutes, resultQuantity, sessionDate } = input;

    // 获取任务信息
    const task = await db('task_definitions')
      .where('task_id', taskId)
      .where('is_active', true)
      .first();

    if (!task) {
      throw new Error('Task not found or inactive');
    }

    // 获取难度信息
    const difficulty = await db('difficulties')
      .where('difficulty_id', difficultyId)
      .where('is_active', true)
      .first();

    if (!difficulty) {
      throw new Error('Difficulty not found or inactive');
    }

    // 计算专注金币
    const focusCoins = this.calculateFocusCoins(focusTimeMinutes);

    // 计算成果金币
    const resultCoins = this.calculateResultCoins(resultQuantity, task.base_coin, difficulty.coefficient);

    // 计算奖励金币
    const bonusCalculation = await this.calculateBonusCoins(userId, taskId, difficulty.label, sessionDate);

    const totalCoins = focusCoins + resultCoins + bonusCalculation.total;

    return {
      focusCoins,
      resultCoins,
      totalCoins,
      bonusCoins: bonusCalculation.total,
      calculations: {
        focusTime: focusTimeMinutes,
        focusRate: this.FOCUS_COIN_RATE,
        resultQuantity,
        baseCoin: task.base_coin,
        difficultyCoefficient: difficulty.coefficient,
        bonuses: bonusCalculation.bonuses,
      },
    };
  }

  /**
   * 计算专注金币
   */
  private static calculateFocusCoins(focusTimeMinutes: number): number {
    if (focusTimeMinutes < this.MIN_FOCUS_TIME) {
      return 0;
    }
    return Math.floor(focusTimeMinutes / this.FOCUS_COIN_RATE);
  }

  /**
   * 计算成果金币
   */
  private static calculateResultCoins(resultQuantity: number, baseCoin: number, difficultyCoefficient: number): number {
    return Math.floor(resultQuantity * baseCoin * difficultyCoefficient);
  }

  /**
   * 计算奖励金币
   */
  private static async calculateBonusCoins(
    userId: string,
    taskId: string,
    difficultyLabel: string,
    sessionDate: string
  ): Promise<{ total: number; bonuses: Array<{ type: string; amount: number; reason: string }> }> {
    const bonuses: Array<{ type: string; amount: number; reason: string }> = [];

    // 1. 连续学习奖励
    const consecutiveBonus = await this.calculateConsecutiveBonus(userId, sessionDate);
    if (consecutiveBonus.amount > 0) {
      bonuses.push(consecutiveBonus);
    }

    // 2. 首次完成任务奖励
    const firstTimeBonus = await this.calculateFirstTimeBonus(userId, taskId);
    if (firstTimeBonus.amount > 0) {
      bonuses.push(firstTimeBonus);
    }

    // 3. 高难度挑战奖励
    const difficultyBonus = this.calculateDifficultyBonus(difficultyLabel);
    if (difficultyBonus.amount > 0) {
      bonuses.push(difficultyBonus);
    }

    // 4. 每日目标达成奖励
    const dailyGoalBonus = await this.calculateDailyGoalBonus(userId, sessionDate);
    if (dailyGoalBonus.amount > 0) {
      bonuses.push(dailyGoalBonus);
    }

    // 5. 周末学习奖励
    const weekendBonus = this.calculateWeekendBonus(sessionDate);
    if (weekendBonus.amount > 0) {
      bonuses.push(weekendBonus);
    }

    const total = bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
    return { total, bonuses };
  }

  /**
   * 计算连续学习奖励
   */
  private static async calculateConsecutiveBonus(
    userId: string,
    sessionDate: string
  ): Promise<{ type: string; amount: number; reason: string }> {
    // 获取连续学习天数
    const consecutiveDays = await this.getConsecutiveLearningDays(userId, sessionDate);
    
    let amount = 0;
    let reason = '';

    if (consecutiveDays >= 7) {
      amount = 10;
      reason = `连续学习${consecutiveDays}天奖励`;
    } else if (consecutiveDays >= 3) {
      amount = 5;
      reason = `连续学习${consecutiveDays}天奖励`;
    }

    return { type: 'consecutive', amount, reason };
  }

  /**
   * 计算首次完成任务奖励
   */
  private static async calculateFirstTimeBonus(
    userId: string,
    taskId: string
  ): Promise<{ type: string; amount: number; reason: string }> {
    const existingSession = await db('learning_sessions')
      .where('user_id', userId)
      .where('task_id', taskId)
      .where('status', 'completed')
      .first();

    if (!existingSession) {
      return { type: 'first_time', amount: 5, reason: '首次完成此类任务奖励' };
    }

    return { type: 'first_time', amount: 0, reason: '' };
  }

  /**
   * 计算难度挑战奖励
   */
  private static calculateDifficultyBonus(
    difficultyLabel: string
  ): { type: string; amount: number; reason: string } {
    let amount = 0;
    let reason = '';

    switch (difficultyLabel) {
      case '困难':
        amount = 3;
        reason = '挑战困难题目奖励';
        break;
      case '极难':
        amount = 8;
        reason = '挑战极难题目奖励';
        break;
      default:
        amount = 0;
    }

    return { type: 'difficulty', amount, reason };
  }

  /**
   * 计算每日目标达成奖励
   */
  private static async calculateDailyGoalBonus(
    userId: string,
    sessionDate: string
  ): Promise<{ type: string; amount: number; reason: string }> {
    // 获取当日已完成的会话数
    const dailySessions = await db('learning_sessions')
      .where('user_id', userId)
      .where('session_date', sessionDate)
      .where('status', 'completed')
      .count('* as count')
      .first();

    const sessionCount = parseInt(dailySessions?.count as string || '0');
    
    // 假设每日目标是3个会话
    const dailyGoal = 3;
    
    if (sessionCount >= dailyGoal) {
      return { type: 'daily_goal', amount: 15, reason: '达成每日学习目标奖励' };
    }

    return { type: 'daily_goal', amount: 0, reason: '' };
  }

  /**
   * 计算周末学习奖励
   */
  private static calculateWeekendBonus(
    sessionDate: string
  ): { type: string; amount: number; reason: string } {
    const date = new Date(sessionDate);
    const dayOfWeek = date.getDay();
    
    // 周六(6)或周日(0)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { type: 'weekend', amount: 2, reason: '周末坚持学习奖励' };
    }

    return { type: 'weekend', amount: 0, reason: '' };
  }

  /**
   * 获取连续学习天数
   */
  private static async getConsecutiveLearningDays(userId: string, currentDate: string): Promise<number> {
    // 获取最近的学习日期（不包括今天）
    const recentSessions = await db('learning_sessions')
      .where('user_id', userId)
      .where('status', 'completed')
      .select('session_date')
      .groupBy('session_date')
      .orderBy('session_date', 'desc')
      .limit(30);

    if (recentSessions.length === 0) {
      return 1; // 今天是第一天
    }

    let consecutiveDays = 1; // 包括今天
    const today = new Date(currentDate);
    
    for (let i = 0; i < recentSessions.length; i++) {
      const sessionDate = new Date(recentSessions[i].session_date);
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - consecutiveDays);
      
      // 检查日期是否连续
      if (sessionDate.toDateString() === expectedDate.toDateString()) {
        consecutiveDays++;
      } else {
        break;
      }
    }

    return consecutiveDays;
  }

  /**
   * 记录金币变动到账本
   */
  static async recordCoinTransaction(
    userId: string,
    amount: number,
    changeType: 'earned' | 'decayed' | 'redeemed' | 'bonus' | 'penalty',
    sourceType: string,
    referenceId: string,
    description: string,
    metadata?: any
  ): Promise<void> {
    // 获取当前余额
    const currentBalance = await this.getCurrentBalance(userId);
    const newBalance = currentBalance + amount;

    // 记录到金币账本
    await db('coin_ledger').insert({
      ledger_id: uuidv4(),
      user_id: userId,
      change_type: changeType,
      amount,
      balance_after: newBalance,
      source_type: sourceType,
      reference_id: referenceId,
      description,
      metadata: metadata || {},
    });
  }

  /**
   * 获取用户当前金币余额
   */
  static async getCurrentBalance(userId: string): Promise<number> {
    const latestRecord = await db('coin_ledger')
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .select('balance_after')
      .first();

    return latestRecord?.balance_after || 0;
  }

  /**
   * 获取用户金币历史
   */
  static async getCoinHistory(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      startDate?: string;
      endDate?: string;
      changeType?: string;
    } = {}
  ): Promise<{ records: any[]; total: number }> {
    const { limit = 20, offset = 0, startDate, endDate, changeType } = options;

    let query = db('coin_ledger')
      .where('user_id', userId);

    let countQuery = db('coin_ledger')
      .where('user_id', userId)
      .count('* as count');

    if (startDate) {
      query = query.where('created_at', '>=', startDate);
      countQuery = countQuery.where('created_at', '>=', startDate);
    }

    if (endDate) {
      query = query.where('created_at', '<=', endDate);
      countQuery = countQuery.where('created_at', '<=', endDate);
    }

    if (changeType) {
      query = query.where('change_type', changeType);
      countQuery = countQuery.where('change_type', changeType);
    }

    const records = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const [{ count }] = await countQuery;

    return {
      records,
      total: parseInt(count as string),
    };
  }

  /**
   * 批量计算多个会话的金币
   */
  static async batchCalculateCoins(inputs: CoinCalculationInput[]): Promise<CoinCalculationResult[]> {
    const results: CoinCalculationResult[] = [];

    for (const input of inputs) {
      try {
        const result = await this.calculateCoins(input);
        results.push(result);
      } catch (error) {
        console.error(`Failed to calculate coins for session:`, error);
        // 返回默认结果，避免批处理失败
        results.push({
          focusCoins: 0,
          resultCoins: 0,
          totalCoins: 0,
          calculations: {
            focusTime: input.focusTimeMinutes,
            focusRate: this.FOCUS_COIN_RATE,
            resultQuantity: input.resultQuantity,
            baseCoin: 0,
            difficultyCoefficient: 1,
          },
        });
      }
    }

    return results;
  }
}