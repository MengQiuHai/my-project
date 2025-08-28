import { CoinCalculationEngine, CoinCalculationInput } from './CoinCalculationEngine';
import db from '../config/database';

export class CoinService {
  /**
   * 处理学习会话的金币奖励
   */
  static async processSessionReward(sessionData: CoinCalculationInput & { sessionId: string }): Promise<void> {
    const { sessionId, ...calculationInput } = sessionData;

    try {
      // 计算金币
      const coinResult = await CoinCalculationEngine.calculateCoins(calculationInput);

      // 记录总金币收入
      if (coinResult.totalCoins > 0) {
        await CoinCalculationEngine.recordCoinTransaction(
          calculationInput.userId,
          coinResult.totalCoins,
          'earned',
          'session',
          sessionId,
          `学习会话奖励：专注${coinResult.focusCoins}金币 + 成果${coinResult.resultCoins}金币` +
          (coinResult.bonusCoins ? ` + 奖励${coinResult.bonusCoins}金币` : ''),
          {
            sessionId,
            calculations: coinResult.calculations,
          }
        );
      }

      // 如果有奖励金币，单独记录
      if (coinResult.bonusCoins && coinResult.bonusCoins > 0) {
        await CoinCalculationEngine.recordCoinTransaction(
          calculationInput.userId,
          coinResult.bonusCoins,
          'bonus',
          'session_bonus',
          sessionId,
          `学习奖励：${coinResult.calculations.bonuses?.map(b => b.reason).join('、') || '特殊奖励'}`,
          {
            sessionId,
            bonuses: coinResult.calculations.bonuses,
          }
        );
      }
    } catch (error) {
      console.error('Failed to process session reward:', error);
      throw error;
    }
  }

  /**
   * 兑换奖励扣除金币
   */
  static async redeemReward(
    userId: string,
    rewardId: string,
    coinsCost: number,
    description: string
  ): Promise<boolean> {
    const currentBalance = await CoinCalculationEngine.getCurrentBalance(userId);

    if (currentBalance < coinsCost) {
      throw new Error('Insufficient coin balance');
    }

    try {
      await CoinCalculationEngine.recordCoinTransaction(
        userId,
        -coinsCost,
        'redeemed',
        'reward',
        rewardId,
        `兑换奖励：${description}`,
        { rewardId }
      );
      return true;
    } catch (error) {
      console.error('Failed to redeem reward:', error);
      throw error;
    }
  }

  /**
   * 管理员调整金币
   */
  static async adjustCoins(
    userId: string,
    amount: number,
    reason: string,
    adminId: string
  ): Promise<void> {
    const changeType = amount > 0 ? 'bonus' : 'penalty';
    
    try {
      await CoinCalculationEngine.recordCoinTransaction(
        userId,
        amount,
        changeType,
        'admin_adjustment',
        adminId,
        `管理员调整：${reason}`,
        { adminId }
      );
    } catch (error) {
      console.error('Failed to adjust coins:', error);
      throw error;
    }
  }

  /**
   * 获取用户金币摘要
   */
  static async getCoinSummary(userId: string, days: number = 30): Promise<{
    currentBalance: number;
    totalEarned: number;
    totalSpent: number;
    totalDecayed: number;
    recentTransactions: any[];
    earningSources: Array<{
      source: string;
      amount: number;
      count: number;
    }>;
  }> {
    const currentBalance = await CoinCalculationEngine.getCurrentBalance(userId);

    // 获取指定天数内的统计
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 总收入
    const totalEarnedResult = await db('coin_ledger')
      .where('user_id', userId)
      .whereIn('change_type', ['earned', 'bonus'])
      .where('created_at', '>=', startDate.toISOString())
      .sum('amount as total')
      .first();

    // 总支出
    const totalSpentResult = await db('coin_ledger')
      .where('user_id', userId)
      .where('change_type', 'redeemed')
      .where('created_at', '>=', startDate.toISOString())
      .sum('amount as total')
      .first();

    // 总衰减
    const totalDecayedResult = await db('coin_ledger')
      .where('user_id', userId)
      .where('change_type', 'decayed')
      .where('created_at', '>=', startDate.toISOString())
      .sum('amount as total')
      .first();

    // 最近交易
    const { records: recentTransactions } = await CoinCalculationEngine.getCoinHistory(userId, {
      limit: 10,
    });

    // 收入来源分析
    const earningSources = await db('coin_ledger')
      .where('user_id', userId)
      .whereIn('change_type', ['earned', 'bonus'])
      .where('created_at', '>=', startDate.toISOString())
      .select('source_type as source')
      .sum('amount as amount')
      .count('* as count')
      .groupBy('source_type')
      .orderBy('amount', 'desc');

    return {
      currentBalance,
      totalEarned: parseInt(totalEarnedResult?.total || '0'),
      totalSpent: Math.abs(parseInt(totalSpentResult?.total || '0')),
      totalDecayed: Math.abs(parseInt(totalDecayedResult?.total || '0')),
      recentTransactions,
      earningSources: earningSources.map(source => ({
        source: source.source,
        amount: parseInt(source.amount),
        count: parseInt(source.count),
      })),
    };
  }

  /**
   * 获取用户金币排行榜位置
   */
  static async getUserRanking(userId: string): Promise<{
    rank: number;
    totalUsers: number;
    percentile: number;
  }> {
    // 获取所有用户的当前余额
    const userBalances = await db('coin_ledger')
      .select('user_id')
      .max('balance_after as balance')
      .groupBy('user_id')
      .orderBy('balance', 'desc');

    const totalUsers = userBalances.length;
    const userRank = userBalances.findIndex(u => u.user_id === userId) + 1;
    const percentile = userRank > 0 ? ((totalUsers - userRank + 1) / totalUsers) * 100 : 0;

    return {
      rank: userRank || totalUsers + 1,
      totalUsers,
      percentile: Math.round(percentile * 100) / 100,
    };
  }

  /**
   * 获取金币排行榜
   */
  static async getLeaderboard(limit: number = 10): Promise<Array<{
    userId: string;
    username: string;
    balance: number;
    rank: number;
  }>> {
    const leaderboard = await db('coin_ledger')
      .leftJoin('users', 'coin_ledger.user_id', 'users.user_id')
      .select([
        'coin_ledger.user_id',
        'users.username',
        db.raw('MAX(coin_ledger.balance_after) as balance')
      ])
      .where('users.status', 'active')
      .groupBy('coin_ledger.user_id', 'users.username')
      .orderBy('balance', 'desc')
      .limit(limit);

    return leaderboard.map((item, index) => ({
      userId: item.user_id,
      username: item.username,
      balance: parseInt(item.balance),
      rank: index + 1,
    }));
  }

  /**
   * 计算用户的金币效率
   */
  static async calculateCoinEfficiency(userId: string, days: number = 7): Promise<{
    coinsPerHour: number;
    coinsPerSession: number;
    dailyAverage: number;
    efficiency: 'high' | 'medium' | 'low';
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 获取时间段内的学习统计
    const sessionStats = await db('learning_sessions')
      .where('user_id', userId)
      .where('created_at', '>=', startDate.toISOString())
      .select(
        db.raw('COUNT(*) as session_count'),
        db.raw('SUM(focus_time_minutes) as total_focus_time'),
        db.raw('SUM(total_coins) as total_coins')
      )
      .first();

    const sessionCount = parseInt(sessionStats?.session_count || '0');
    const totalFocusTime = parseInt(sessionStats?.total_focus_time || '0');
    const totalCoins = parseInt(sessionStats?.total_coins || '0');

    const coinsPerHour = totalFocusTime > 0 ? (totalCoins / (totalFocusTime / 60)) : 0;
    const coinsPerSession = sessionCount > 0 ? (totalCoins / sessionCount) : 0;
    const dailyAverage = totalCoins / days;

    // 效率评级（基于每小时金币数）
    let efficiency: 'high' | 'medium' | 'low' = 'low';
    if (coinsPerHour >= 10) {
      efficiency = 'high';
    } else if (coinsPerHour >= 5) {
      efficiency = 'medium';
    }

    return {
      coinsPerHour: Math.round(coinsPerHour * 100) / 100,
      coinsPerSession: Math.round(coinsPerSession * 100) / 100,
      dailyAverage: Math.round(dailyAverage * 100) / 100,
      efficiency,
    };
  }
}