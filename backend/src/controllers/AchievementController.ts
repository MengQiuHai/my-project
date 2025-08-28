import { Response } from 'express';
import { AchievementService } from '../services/AchievementService';
import { ResponseHelper } from '../utils/response';
import { AppError, asyncHandler } from '../middleware/error';
import { AuthenticatedRequest } from '../middleware/auth';
import db from '../config/database';

export class AchievementController {
  /**
   * Get user's achievements
   */
  static getUserAchievements = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;

    const achievements = await AchievementService.getUserAchievements(userId);
    
    ResponseHelper.success(res, achievements, 'User achievements retrieved successfully');
  });

  /**
   * Get achievement progress
   */
  static getProgress = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;

    const progress = await AchievementService.getAchievementProgress(userId);
    
    ResponseHelper.success(res, progress, 'Achievement progress retrieved successfully');
  });

  /**
   * Check and award new achievements
   */
  static checkAchievements = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;

    const newAchievements = await AchievementService.checkAndAwardAchievements(userId);
    
    ResponseHelper.success(res, {
      newAchievements,
      count: newAchievements.length,
    }, newAchievements.length > 0 ? 
      `Congratulations! You unlocked ${newAchievements.length} new achievement(s)!` : 
      'No new achievements at this time'
    );
  });

  /**
   * Get all available achievements
   */
  static getAllAchievements = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { category, rarity } = req.query;

    let achievements = await AchievementService.getActiveAchievements();

    // Filter by category if specified
    if (category) {
      achievements = achievements.filter(a => a.category === category);
    }

    // Filter by rarity if specified
    if (rarity) {
      achievements = achievements.filter(a => a.rarity === rarity);
    }

    ResponseHelper.success(res, achievements, 'Achievements retrieved successfully');
  });

  /**
   * Get achievement categories
   */
  static getCategories = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const achievements = await AchievementService.getActiveAchievements();
    
    const categories = [...new Set(achievements.map(a => a.category))];
    const categoryStats = categories.map(category => ({
      name: category,
      count: achievements.filter(a => a.category === category).length,
    }));

    ResponseHelper.success(res, categoryStats, 'Achievement categories retrieved successfully');
  });

  /**
   * Get achievement by ID
   */
  static getById = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { achievementId } = req.params;
    const userId = req.user!.user_id;

    const achievements = await AchievementService.getActiveAchievements();
    const achievement = achievements.find(a => a.achievement_id === achievementId);

    if (!achievement) {
      throw new AppError('Achievement not found', 404);
    }

    // Check if user has this achievement
    const userAchievements = await AchievementService.getUserAchievements(userId);
    const userAchievement = userAchievements.find(ua => ua.achievement_id === achievementId);

    // Get progress if not completed
    let progress = null;
    if (!userAchievement) {
      const progressData = await AchievementService.getAchievementProgress(userId);
      progress = progressData.find(p => p.achievement.achievement_id === achievementId);
    }

    ResponseHelper.success(res, {
      achievement,
      userAchievement,
      progress,
      isCompleted: !!userAchievement,
    }, 'Achievement details retrieved successfully');
  });

  // Admin functions

  /**
   * Get all achievements (Admin)
   */
  static adminGetAll = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (req.user!.role !== 'admin') {
      throw new AppError('Admin privileges required', 403);
    }

    const {
      page = 1,
      limit = 20,
      category,
      rarity,
      isActive,
    } = req.query;

    // This is a simplified version - in a real implementation, 
    // you would add proper pagination and filtering from the database
    const achievements = await AchievementService.getActiveAchievements();

    ResponseHelper.paginated(
      res,
      achievements,
      Number(page),
      Number(limit),
      achievements.length,
      'All achievements retrieved successfully'
    );
  });

  /**
   * Create achievement (Admin)
   */
  static createAchievement = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (req.user!.role !== 'admin') {
      throw new AppError('Admin privileges required', 403);
    }

    const achievementData = req.body;

    const achievement = await AchievementService.createAchievement(achievementData);
    
    ResponseHelper.created(res, achievement, 'Achievement created successfully');
  });

  /**
   * Update achievement (Admin)
   */
  static updateAchievement = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (req.user!.role !== 'admin') {
      throw new AppError('Admin privileges required', 403);
    }

    const { achievementId } = req.params;
    const updateData = req.body;

    const achievement = await AchievementService.updateAchievement(achievementId, updateData);

    if (!achievement) {
      throw new AppError('Achievement not found', 404);
    }

    ResponseHelper.success(res, achievement, 'Achievement updated successfully');
  });

  /**
   * Delete achievement (Admin)
   */
  static deleteAchievement = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (req.user!.role !== 'admin') {
      throw new AppError('Admin privileges required', 403);
    }

    const { achievementId } = req.params;

    const success = await AchievementService.deleteAchievement(achievementId);

    if (!success) {
      throw new AppError('Achievement not found', 404);
    }

    ResponseHelper.success(res, null, 'Achievement deleted successfully');
  });

  /**
   * Get achievement statistics (Admin)
   */
  static getStatistics = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (req.user!.role !== 'admin') {
      throw new AppError('Admin privileges required', 403);
    }

    const statistics = await AchievementService.getAchievementStatistics();
    
    ResponseHelper.success(res, statistics, 'Achievement statistics retrieved successfully');
  });

  /**
   * Batch check achievements for all users (Admin)
   */
  static batchCheck = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (req.user!.role !== 'admin') {
      throw new AppError('Admin privileges required', 403);
    }

    // Run in background
    AchievementService.batchCheckAchievements().catch(error => {
      console.error('Batch achievement check failed:', error);
    });

    ResponseHelper.success(res, null, 'Batch achievement check started');
  });

  /**
   * Get user achievement summary
   */
  static getSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;

    const [userAchievements, allAchievements] = await Promise.all([
      AchievementService.getUserAchievements(userId),
      AchievementService.getActiveAchievements(),
    ]);

    const summary = {
      totalEarned: userAchievements.length,
      totalAvailable: allAchievements.length,
      completionPercentage: allAchievements.length > 0 ? 
        Math.round((userAchievements.length / allAchievements.length) * 100) : 0,
      byRarity: {
        common: userAchievements.filter(a => a.rarity === 'common').length,
        rare: userAchievements.filter(a => a.rarity === 'rare').length,
        epic: userAchievements.filter(a => a.rarity === 'epic').length,
        legendary: userAchievements.filter(a => a.rarity === 'legendary').length,
      },
      byCategory: userAchievements.reduce((acc, achievement) => {
        acc[achievement.category] = (acc[achievement.category] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number }),
      totalPoints: userAchievements.reduce((sum, a) => sum + (a.points || 0), 0),
      recentAchievements: userAchievements
        .sort((a, b) => new Date(b.achieved_at).getTime() - new Date(a.achieved_at).getTime())
        .slice(0, 5),
    };

    ResponseHelper.success(res, summary, 'Achievement summary retrieved successfully');
  });

  /**
   * Get leaderboard based on achievements
   */
  static getLeaderboard = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { limit = 10, type = 'points' } = req.query;

    // This is a simplified implementation
    // In a real system, you would optimize this query
    let leaderboard;

    if (type === 'points') {
      // Leaderboard by total achievement points
      leaderboard = await db('user_achievements')
        .leftJoin('users', 'user_achievements.user_id', 'users.user_id')
        .leftJoin('achievements', 'user_achievements.achievement_id', 'achievements.achievement_id')
        .where('users.status', 'active')
        .select([
          'users.user_id',
          'users.username',
          db.raw('SUM(achievements.points) as total_points'),
          db.raw('COUNT(user_achievements.achievement_id) as total_achievements'),
        ])
        .groupBy('users.user_id', 'users.username')
        .orderBy('total_points', 'desc')
        .limit(Number(limit));
    } else {
      // Leaderboard by number of achievements
      leaderboard = await db('user_achievements')
        .leftJoin('users', 'user_achievements.user_id', 'users.user_id')
        .where('users.status', 'active')
        .select([
          'users.user_id',
          'users.username',
          db.raw('COUNT(user_achievements.achievement_id) as total_achievements'),
        ])
        .groupBy('users.user_id', 'users.username')
        .orderBy('total_achievements', 'desc')
        .limit(Number(limit));
    }

    const formattedLeaderboard = leaderboard.map((item, index) => ({
      rank: index + 1,
      userId: item.user_id,
      username: item.username,
      totalAchievements: parseInt(item.total_achievements || '0'),
      totalPoints: parseInt(item.total_points || '0'),
    }));

    ResponseHelper.success(res, formattedLeaderboard, 'Achievement leaderboard retrieved successfully');
  });
}