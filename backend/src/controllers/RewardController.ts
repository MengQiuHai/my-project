import { Response } from 'express';
import { RewardService } from '../services/RewardService';
import { ResponseHelper } from '../utils/response';
import { AppError, asyncHandler } from '../middleware/error';
import { AuthenticatedRequest } from '../middleware/auth';

export class RewardController {
  /**
   * Get user's rewards
   */
  static getUserRewards = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;
    const {
      page = 1,
      limit = 20,
      category,
      isActive,
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const result = await RewardService.getUserRewards(userId, {
      category: category as string,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      limit: Number(limit),
      offset,
    });

    ResponseHelper.paginated(
      res,
      result.rewards,
      Number(page),
      Number(limit),
      result.total,
      'Rewards retrieved successfully'
    );
  });

  /**
   * Create a new reward
   */
  static createReward = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;
    const rewardData = req.body;

    const reward = await RewardService.createReward(userId, rewardData);
    
    ResponseHelper.created(res, reward, 'Reward created successfully');
  });

  /**
   * Update reward
   */
  static updateReward = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;
    const { rewardId } = req.params;
    const updateData = req.body;

    const reward = await RewardService.updateReward(userId, rewardId, updateData);

    if (!reward) {
      throw new AppError('Reward not found or access denied', 404);
    }

    ResponseHelper.success(res, reward, 'Reward updated successfully');
  });

  /**
   * Delete reward
   */
  static deleteReward = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;
    const { rewardId } = req.params;

    const success = await RewardService.deleteReward(userId, rewardId);

    if (!success) {
      throw new AppError('Reward not found or access denied', 404);
    }

    ResponseHelper.success(res, null, 'Reward deleted successfully');
  });

  /**
   * Redeem a reward
   */
  static redeemReward = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;
    const { rewardId } = req.params;
    const { notes } = req.body;

    try {
      const redemption = await RewardService.redeemReward(userId, rewardId, notes);
      
      ResponseHelper.success(res, redemption, 'Reward redeemed successfully! Enjoy your reward! 🎉');
    } catch (error: any) {
      throw new AppError(error.message, 400);
    }
  });

  /**
   * Get redemption history
   */
  static getRedemptionHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      status,
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const result = await RewardService.getRedemptionHistory(userId, {
      limit: Number(limit),
      offset,
      startDate: startDate as string,
      endDate: endDate as string,
      status: status as string,
    });

    ResponseHelper.paginated(
      res,
      result.redemptions,
      Number(page),
      Number(limit),
      result.total,
      'Redemption history retrieved successfully'
    );
  });

  /**
   * Get redemption statistics
   */
  static getStatistics = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;
    const { days = 30 } = req.query;

    const statistics = await RewardService.getRedemptionStatistics(userId, Number(days));
    
    ResponseHelper.success(res, statistics, 'Redemption statistics retrieved successfully');
  });

  /**
   * Get reward categories
   */
  static getCategories = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;

    const categories = await RewardService.getRewardCategories(userId);
    
    ResponseHelper.success(res, categories, 'Reward categories retrieved successfully');
  });

  /**
   * Get recommended rewards
   */
  static getRecommendations = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;
    const { limit = 5 } = req.query;

    const recommendations = await RewardService.getRecommendedRewards(userId, Number(limit));
    
    ResponseHelper.success(res, recommendations, 'Reward recommendations retrieved successfully');
  });

  /**
   * Get reward by ID
   */
  static getById = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;
    const { rewardId } = req.params;

    const result = await RewardService.getUserRewards(userId, { limit: 1000 });
    const reward = result.rewards.find(r => r.reward_id === rewardId);

    if (!reward) {
      throw new AppError('Reward not found', 404);
    }

    ResponseHelper.success(res, reward, 'Reward retrieved successfully');
  });

  /**
   * Check if reward can be redeemed
   */
  static canRedeem = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;
    const { rewardId } = req.params;

    // Get reward
    const result = await RewardService.getUserRewards(userId, { limit: 1000 });
    const reward = result.rewards.find(r => r.reward_id === rewardId);

    if (!reward) {
      throw new AppError('Reward not found', 404);
    }

    const canRedeemInfo = await RewardService.canRedeemReward(userId, reward);
    
    ResponseHelper.success(res, canRedeemInfo, 'Reward redemption check completed');
  });

  /**
   * Create default rewards for new user
   */
  static createDefaultRewards = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;

    // Check if user already has rewards
    const existingRewards = await RewardService.getUserRewards(userId, { limit: 1 });
    
    if (existingRewards.total > 0) {
      throw new AppError('User already has rewards', 400);
    }

    await RewardService.createDefaultRewards(userId);
    
    ResponseHelper.success(res, null, 'Default rewards created successfully');
  });

  /**
   * Get reward shop summary
   */
  static getShopSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;

    const [
      rewardsResult,
      categories,
      recommendations,
      statistics,
    ] = await Promise.all([
      RewardService.getUserRewards(userId, { isActive: true }),
      RewardService.getRewardCategories(userId),
      RewardService.getRecommendedRewards(userId, 3),
      RewardService.getRedemptionStatistics(userId, 7),
    ]);

    const summary = {
      totalRewards: rewardsResult.total,
      affordableRewards: rewardsResult.rewards.filter(r => r.can_redeem).length,
      categories: categories.length,
      categoryBreakdown: categories,
      recommendations,
      weeklyStats: {
        redemptions: statistics.totalRedemptions,
        coinsSpent: statistics.totalCoinsSpent,
      },
    };
    
    ResponseHelper.success(res, summary, 'Reward shop summary retrieved successfully');
  });

  /**
   * Bulk update rewards status
   */
  static bulkUpdateStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;
    const { rewardIds, isActive } = req.body;

    if (!Array.isArray(rewardIds) || rewardIds.length === 0) {
      throw new AppError('Reward IDs array is required', 400);
    }

    if (rewardIds.length > 50) {
      throw new AppError('Maximum 50 rewards can be updated at once', 400);
    }

    const updatePromises = rewardIds.map(rewardId =>
      RewardService.updateReward(userId, rewardId, { is_active: isActive })
    );

    const results = await Promise.allSettled(updatePromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.length - successful;

    ResponseHelper.success(res, {
      successful,
      failed,
      total: results.length,
    }, `Bulk update completed: ${successful} successful, ${failed} failed`);
  });
}