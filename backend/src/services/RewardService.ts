import db from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { CoinService } from './CoinService';
import { CoinCalculationEngine } from './CoinCalculationEngine';

export interface Reward {
  reward_id: string;
  user_id: string;
  name: string;
  description?: string;
  cost_coins: number;
  category: 'entertainment' | 'food' | 'shopping' | 'activity' | 'rest' | 'other';
  icon?: string;
  is_active: boolean;
  usage_limit: number;
  cooldown_hours: number;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface Redemption {
  redemption_id: string;
  user_id: string;
  reward_id: string;
  coins_spent: number;
  redeemed_at: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  completed_at?: string;
  metadata?: any;
}

export interface RewardWithUsage extends Reward {
  usage_count: number;
  last_used_at?: string;
  can_redeem: boolean;
  next_available_at?: string;
  reason?: string;
}

export class RewardService {
  /**
   * Create a new reward for a user
   */
  static async createReward(userId: string, rewardData: {
    name: string;
    description?: string;
    cost_coins: number;
    category: string;
    icon?: string;
    usage_limit?: number;
    cooldown_hours?: number;
    metadata?: any;
  }): Promise<Reward> {
    const rewardId = uuidv4();

    const [reward] = await db('rewards')
      .insert({
        reward_id: rewardId,
        user_id: userId,
        name: rewardData.name,
        description: rewardData.description,
        cost_coins: rewardData.cost_coins,
        category: rewardData.category,
        icon: rewardData.icon,
        usage_limit: rewardData.usage_limit || 0,
        cooldown_hours: rewardData.cooldown_hours || 0,
        is_active: true,
        metadata: rewardData.metadata || {},
      })
      .returning('*');

    return reward;
  }

  /**
   * Get user's rewards with usage information
   */
  static async getUserRewards(
    userId: string,
    options: {
      category?: string;
      isActive?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ rewards: RewardWithUsage[]; total: number }> {
    const { category, isActive, limit = 20, offset = 0 } = options;

    let query = db('rewards')
      .where('user_id', userId);

    let countQuery = db('rewards')
      .where('user_id', userId)
      .count('* as count');

    if (category) {
      query = query.where('category', category);
      countQuery = countQuery.where('category', category);
    }

    if (isActive !== undefined) {
      query = query.where('is_active', isActive);
      countQuery = countQuery.where('is_active', isActive);
    }

    const rewards = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const [{ count }] = await countQuery;

    // Get usage information for each reward
    const rewardsWithUsage = await Promise.all(
      rewards.map(async (reward) => {
        const usageInfo = await this.getRewardUsageInfo(userId, reward.reward_id);
        const canRedeemInfo = await this.canRedeemReward(userId, reward);

        return {
          ...reward,
          usage_count: usageInfo.count,
          last_used_at: usageInfo.lastUsedAt,
          can_redeem: canRedeemInfo.canRedeem,
          next_available_at: canRedeemInfo.nextAvailableAt,
          reason: canRedeemInfo.reason,
        };
      })
    );

    return {
      rewards: rewardsWithUsage,
      total: parseInt(count as string),
    };
  }

  /**
   * Redeem a reward
   */
  static async redeemReward(
    userId: string,
    rewardId: string,
    notes?: string
  ): Promise<Redemption> {
    // Get reward details
    const reward = await db('rewards')
      .where('reward_id', rewardId)
      .where('user_id', userId)
      .where('is_active', true)
      .first();

    if (!reward) {
      throw new Error('Reward not found or not available');
    }

    // Check if user can redeem this reward
    const canRedeemInfo = await this.canRedeemReward(userId, reward);
    if (!canRedeemInfo.canRedeem) {
      throw new Error(canRedeemInfo.reason || 'Cannot redeem this reward');
    }

    // Check user's coin balance
    const currentBalance = await CoinCalculationEngine.getCurrentBalance(userId);
    if (currentBalance < reward.cost_coins) {
      throw new Error('Insufficient coin balance');
    }

    const redemptionId = uuidv4();

    // Create redemption record
    const [redemption] = await db('redemptions')
      .insert({
        redemption_id: redemptionId,
        user_id: userId,
        reward_id: rewardId,
        coins_spent: reward.cost_coins,
        redeemed_at: new Date().toISOString(),
        status: 'completed',
        notes,
        completed_at: new Date().toISOString(),
        metadata: {
          reward_name: reward.name,
          reward_category: reward.category,
        },
      })
      .returning('*');

    // Deduct coins
    await CoinService.redeemReward(
      userId,
      rewardId,
      reward.cost_coins,
      reward.name
    );

    return redemption;
  }

  /**
   * Check if user can redeem a specific reward
   */
  static async canRedeemReward(
    userId: string,
    reward: Reward
  ): Promise<{
    canRedeem: boolean;
    reason?: string;
    nextAvailableAt?: string;
  }> {
    // Check if reward is active
    if (!reward.is_active) {
      return {
        canRedeem: false,
        reason: 'Reward is not available',
      };
    }

    // Check usage limit
    if (reward.usage_limit > 0) {
      const usageInfo = await this.getRewardUsageInfo(userId, reward.reward_id);
      if (usageInfo.count >= reward.usage_limit) {
        return {
          canRedeem: false,
          reason: `Usage limit reached (${reward.usage_limit} times)`,
        };
      }
    }

    // Check cooldown
    if (reward.cooldown_hours > 0) {
      const lastRedemption = await db('redemptions')
        .where('user_id', userId)
        .where('reward_id', reward.reward_id)
        .where('status', 'completed')
        .orderBy('redeemed_at', 'desc')
        .first();

      if (lastRedemption) {
        const lastRedeemTime = new Date(lastRedemption.redeemed_at);
        const cooldownEndTime = new Date(lastRedeemTime.getTime() + (reward.cooldown_hours * 60 * 60 * 1000));
        const now = new Date();

        if (now < cooldownEndTime) {
          return {
            canRedeem: false,
            reason: `Cooldown period active (${reward.cooldown_hours} hours)`,
            nextAvailableAt: cooldownEndTime.toISOString(),
          };
        }
      }
    }

    // Check coin balance
    const currentBalance = await CoinCalculationEngine.getCurrentBalance(userId);
    if (currentBalance < reward.cost_coins) {
      return {
        canRedeem: false,
        reason: `Insufficient coins (need ${reward.cost_coins}, have ${currentBalance})`,
      };
    }

    return { canRedeem: true };
  }

  /**
   * Get reward usage information
   */
  static async getRewardUsageInfo(
    userId: string,
    rewardId: string
  ): Promise<{
    count: number;
    lastUsedAt?: string;
  }> {
    const usage = await db('redemptions')
      .where('user_id', userId)
      .where('reward_id', rewardId)
      .where('status', 'completed')
      .select(
        db.raw('COUNT(*) as count'),
        db.raw('MAX(redeemed_at) as last_used_at')
      )
      .first();

    return {
      count: parseInt(usage?.count || '0'),
      lastUsedAt: usage?.last_used_at || undefined,
    };
  }

  /**
   * Update reward
   */
  static async updateReward(
    userId: string,
    rewardId: string,
    updateData: Partial<{
      name: string;
      description: string;
      cost_coins: number;
      category: string;
      icon: string;
      usage_limit: number;
      cooldown_hours: number;
      is_active: boolean;
      metadata: any;
    }>
  ): Promise<Reward | null> {
    const [reward] = await db('rewards')
      .where('reward_id', rewardId)
      .where('user_id', userId)
      .update({
        ...updateData,
        updated_at: db.fn.now(),
      })
      .returning('*');

    return reward || null;
  }

  /**
   * Delete reward
   */
  static async deleteReward(userId: string, rewardId: string): Promise<boolean> {
    // Check if reward has any redemptions
    const redemptionCount = await db('redemptions')
      .where('reward_id', rewardId)
      .count('* as count')
      .first();

    if (parseInt(redemptionCount?.count as string || '0') > 0) {
      // If there are redemptions, just deactivate the reward
      const updated = await db('rewards')
        .where('reward_id', rewardId)
        .where('user_id', userId)
        .update({
          is_active: false,
          updated_at: db.fn.now(),
        });
      
      return updated > 0;
    } else {
      // If no redemptions, delete completely
      const deleted = await db('rewards')
        .where('reward_id', rewardId)
        .where('user_id', userId)
        .del();
      
      return deleted > 0;
    }
  }

  /**
   * Get user's redemption history
   */
  static async getRedemptionHistory(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      startDate?: string;
      endDate?: string;
      status?: string;
    } = {}
  ): Promise<{ redemptions: any[]; total: number }> {
    const { limit = 20, offset = 0, startDate, endDate, status } = options;

    let query = db('redemptions')
      .leftJoin('rewards', 'redemptions.reward_id', 'rewards.reward_id')
      .where('redemptions.user_id', userId)
      .select([
        'redemptions.*',
        'rewards.name as reward_name',
        'rewards.category as reward_category',
        'rewards.icon as reward_icon',
      ]);

    let countQuery = db('redemptions')
      .where('user_id', userId)
      .count('* as count');

    if (startDate) {
      query = query.where('redemptions.redeemed_at', '>=', startDate);
      countQuery = countQuery.where('redeemed_at', '>=', startDate);
    }

    if (endDate) {
      query = query.where('redemptions.redeemed_at', '<=', endDate);
      countQuery = countQuery.where('redeemed_at', '<=', endDate);
    }

    if (status) {
      query = query.where('redemptions.status', status);
      countQuery = countQuery.where('status', status);
    }

    const redemptions = await query
      .orderBy('redemptions.redeemed_at', 'desc')
      .limit(limit)
      .offset(offset);

    const [{ count }] = await countQuery;

    return {
      redemptions,
      total: parseInt(count as string),
    };
  }

  /**
   * Get redemption statistics
   */
  static async getRedemptionStatistics(
    userId: string,
    days: number = 30
  ): Promise<{
    totalRedemptions: number;
    totalCoinsSpent: number;
    avgCoinsPerRedemption: number;
    favoriteCategory: string;
    categoryBreakdown: Array<{
      category: string;
      count: number;
      coinsSpent: number;
    }>;
    recentRedemptions: any[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Overall statistics
    const overallStats = await db('redemptions')
      .where('user_id', userId)
      .where('status', 'completed')
      .where('redeemed_at', '>=', startDate.toISOString())
      .select(
        db.raw('COUNT(*) as total_redemptions'),
        db.raw('SUM(coins_spent) as total_coins_spent'),
        db.raw('AVG(coins_spent) as avg_coins_per_redemption')
      )
      .first();

    // Category breakdown
    const categoryStats = await db('redemptions')
      .leftJoin('rewards', 'redemptions.reward_id', 'rewards.reward_id')
      .where('redemptions.user_id', userId)
      .where('redemptions.status', 'completed')
      .where('redemptions.redeemed_at', '>=', startDate.toISOString())
      .select([
        'rewards.category',
        db.raw('COUNT(*) as count'),
        db.raw('SUM(redemptions.coins_spent) as coins_spent'),
      ])
      .groupBy('rewards.category')
      .orderBy('count', 'desc');

    // Recent redemptions
    const recentRedemptions = await this.getRedemptionHistory(userId, {
      limit: 5,
    });

    const favoriteCategory = categoryStats.length > 0 ? categoryStats[0].category : 'none';

    return {
      totalRedemptions: parseInt(overallStats?.total_redemptions || '0'),
      totalCoinsSpent: parseInt(overallStats?.total_coins_spent || '0'),
      avgCoinsPerRedemption: parseFloat(overallStats?.avg_coins_per_redemption || '0'),
      favoriteCategory,
      categoryBreakdown: categoryStats.map(stat => ({
        category: stat.category,
        count: parseInt(stat.count),
        coinsSpent: parseInt(stat.coins_spent),
      })),
      recentRedemptions: recentRedemptions.redemptions,
    };
  }

  /**
   * Get reward categories with counts
   */
  static async getRewardCategories(userId: string): Promise<Array<{
    category: string;
    count: number;
    totalCost: number;
    avgCost: number;
  }>> {
    const categories = await db('rewards')
      .where('user_id', userId)
      .where('is_active', true)
      .select([
        'category',
        db.raw('COUNT(*) as count'),
        db.raw('SUM(cost_coins) as total_cost'),
        db.raw('AVG(cost_coins) as avg_cost'),
      ])
      .groupBy('category')
      .orderBy('count', 'desc');

    return categories.map(cat => ({
      category: cat.category,
      count: parseInt(cat.count),
      totalCost: parseInt(cat.total_cost),
      avgCost: Math.round(parseFloat(cat.avg_cost)),
    }));
  }

  /**
   * Get recommended rewards based on user behavior
   */
  static async getRecommendedRewards(
    userId: string,
    limit: number = 5
  ): Promise<RewardWithUsage[]> {
    // Get user's coin balance
    const currentBalance = await CoinCalculationEngine.getCurrentBalance(userId);

    // Get user's redemption history to understand preferences
    const redemptionStats = await this.getRedemptionStatistics(userId, 90);

    // Get affordable rewards
    const affordableRewards = await db('rewards')
      .where('user_id', userId)
      .where('is_active', true)
      .where('cost_coins', '<=', currentBalance)
      .orderBy('cost_coins', 'desc')
      .limit(limit * 2); // Get more than needed to filter

    // Add usage information and filter
    const rewardsWithUsage = await Promise.all(
      affordableRewards.map(async (reward) => {
        const usageInfo = await this.getRewardUsageInfo(userId, reward.reward_id);
        const canRedeemInfo = await this.canRedeemReward(userId, reward);

        return {
          ...reward,
          usage_count: usageInfo.count,
          last_used_at: usageInfo.lastUsedAt,
          can_redeem: canRedeemInfo.canRedeem,
          next_available_at: canRedeemInfo.nextAvailableAt,
          reason: canRedeemInfo.reason,
        };
      })
    );

    // Filter only redeemable rewards and prioritize by category preference
    const redeemableRewards = rewardsWithUsage.filter(r => r.can_redeem);

    // Sort by category preference (favorite category first) and then by cost
    const favoriteCategory = redemptionStats.favoriteCategory;
    redeemableRewards.sort((a, b) => {
      if (a.category === favoriteCategory && b.category !== favoriteCategory) return -1;
      if (a.category !== favoriteCategory && b.category === favoriteCategory) return 1;
      return b.cost_coins - a.cost_coins; // Higher cost first
    });

    return redeemableRewards.slice(0, limit);
  }

  /**
   * Bulk create default rewards for new users
   */
  static async createDefaultRewards(userId: string): Promise<void> {
    const defaultRewards = [
      {
        name: '看1小时视频',
        description: '观看娱乐视频或电影1小时',
        cost_coins: 30,
        category: 'entertainment',
        icon: '📺',
        cooldown_hours: 2,
      },
      {
        name: '玩游戏30分钟',
        description: '游戏娱乐时间',
        cost_coins: 20,
        category: 'entertainment',
        icon: '🎮',
        cooldown_hours: 1,
      },
      {
        name: '买杯奶茶',
        description: '奖励自己一杯喜欢的饮品',
        cost_coins: 50,
        category: 'food',
        icon: '🧋',
        cooldown_hours: 24,
      },
      {
        name: '购物100元',
        description: '允许自己购买想要的物品',
        cost_coins: 200,
        category: 'shopping',
        icon: '🛍️',
        cooldown_hours: 48,
      },
      {
        name: '户外运动',
        description: '进行喜欢的户外活动',
        cost_coins: 40,
        category: 'activity',
        icon: '🏃',
        cooldown_hours: 6,
      },
      {
        name: '午睡30分钟',
        description: '舒适的午休时间',
        cost_coins: 15,
        category: 'rest',
        icon: '😴',
        cooldown_hours: 12,
      },
    ] as const;

    for (const rewardData of defaultRewards) {
      await this.createReward(userId, rewardData);
    }
  }
}