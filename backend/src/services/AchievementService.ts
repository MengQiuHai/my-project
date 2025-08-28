import db from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { CoinCalculationEngine } from './CoinCalculationEngine';

export interface Achievement {
  achievement_id: string;
  name: string;
  description: string;
  condition_expression: string;
  icon?: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  is_active: boolean;
  metadata?: any;
}

export interface UserAchievement {
  user_achievement_id: string;
  user_id: string;
  achievement_id: string;
  achieved_at: string;
  achievement_data?: any;
}

export interface AchievementProgress {
  achievement: Achievement;
  progress: number;
  maxValue: number;
  isCompleted: boolean;
  nextMilestone?: number;
}

export class AchievementService {
  /**
   * Check and award achievements for a user
   */
  static async checkAndAwardAchievements(userId: string): Promise<UserAchievement[]> {
    const activeAchievements = await this.getActiveAchievements();
    const userAchievements = await this.getUserAchievements(userId);
    const completedAchievementIds = new Set(userAchievements.map(ua => ua.achievement_id));
    
    const newAchievements: UserAchievement[] = [];
    
    for (const achievement of activeAchievements) {
      if (completedAchievementIds.has(achievement.achievement_id)) {
        continue; // Already completed
      }
      
      const isEligible = await this.evaluateAchievementCondition(userId, achievement);
      
      if (isEligible) {
        const newAchievement = await this.awardAchievement(userId, achievement);
        newAchievements.push(newAchievement);
      }
    }
    
    return newAchievements;
  }

  /**
   * Award an achievement to a user
   */
  static async awardAchievement(userId: string, achievement: Achievement): Promise<UserAchievement> {
    const userAchievementId = uuidv4();
    const currentData = await this.getUserStatistics(userId);
    
    const [userAchievement] = await db('user_achievements')
      .insert({
        user_achievement_id: userAchievementId,
        user_id: userId,
        achievement_id: achievement.achievement_id,
        achieved_at: new Date().toISOString(),
        achievement_data: currentData,
      })
      .returning('*');

    // Award bonus coins for achievement
    if (achievement.points > 0) {
      await CoinCalculationEngine.recordCoinTransaction(
        userId,
        achievement.points,
        'bonus',
        'achievement',
        achievement.achievement_id,
        `Achievement unlocked: ${achievement.name}`,
        {
          achievement_id: achievement.achievement_id,
          achievement_name: achievement.name,
          rarity: achievement.rarity,
        }
      );
    }

    console.log(`Achievement awarded: ${achievement.name} to user ${userId}`);
    return userAchievement;
  }

  /**
   * Evaluate achievement condition
   */
  static async evaluateAchievementCondition(userId: string, achievement: Achievement): Promise<boolean> {
    const userStats = await this.getUserStatistics(userId);
    
    try {
      // Parse and evaluate the condition expression
      return this.evaluateCondition(achievement.condition_expression, userStats);
    } catch (error) {
      console.error(`Error evaluating achievement condition for ${achievement.name}:`, error);
      return false;
    }
  }

  /**
   * Simple condition evaluator
   */
  private static evaluateCondition(expression: string, stats: any): boolean {
    // Replace variables in expression with actual values
    let evaluableExpression = expression;
    
    // Common statistics mappings
    const mappings = {
      'total_sessions': stats.totalSessions || 0,
      'total_coins_earned': stats.totalCoinsEarned || 0,
      'current_coin_balance': stats.currentBalance || 0,
      'consecutive_days': stats.consecutiveDays || 0,
      'total_focus_hours': stats.totalFocusHours || 0,
      'daily_focus_hours': stats.dailyFocusHours || 0,
      'difficult_tasks_completed': stats.difficultTasksCompleted || 0,
      'extreme_tasks_completed': stats.extremeTasksCompleted || 0,
    };

    // Handle subject-specific conditions
    if (expression.includes('subject_coins.')) {
      const subjectMatch = expression.match(/subject_coins\.(\w+)/g);
      if (subjectMatch && stats.subjectCoins) {
        subjectMatch.forEach(match => {
          const subject = match.split('.')[1];
          const value = stats.subjectCoins[subject] || 0;
          evaluableExpression = evaluableExpression.replace(match, value.toString());
        });
      }
    }

    // Replace other variables
    Object.entries(mappings).forEach(([key, value]) => {
      evaluableExpression = evaluableExpression.replace(new RegExp(key, 'g'), value.toString());
    });

    // Evaluate the expression safely
    try {
      // Only allow safe mathematical expressions
      if (!/^[0-9+\-*/<>=!\s&|()]+$/.test(evaluableExpression)) {
        console.warn(`Potentially unsafe expression: ${evaluableExpression}`);
        return false;
      }
      
      return Function(`"use strict"; return (${evaluableExpression})`)();
    } catch (error) {
      console.error(`Error evaluating expression: ${evaluableExpression}`, error);
      return false;
    }
  }

  /**
   * Get user statistics for achievement evaluation
   */
  static async getUserStatistics(userId: string): Promise<any> {
    // Get basic session statistics
    const sessionStats = await db('learning_sessions')
      .leftJoin('task_definitions', 'learning_sessions.task_id', 'task_definitions.task_id')
      .leftJoin('difficulties', 'learning_sessions.difficulty_id', 'difficulties.difficulty_id')
      .where('learning_sessions.user_id', userId)
      .where('learning_sessions.status', 'completed')
      .select(
        db.raw('COUNT(*) as total_sessions'),
        db.raw('SUM(total_coins) as total_coins_earned'),
        db.raw('SUM(focus_time_minutes) as total_focus_minutes'),
        db.raw('COUNT(CASE WHEN difficulties.label = \'困难\' THEN 1 END) as difficult_tasks'),
        db.raw('COUNT(CASE WHEN difficulties.label = \'极难\' THEN 1 END) as extreme_tasks')
      )
      .first();

    // Get current coin balance
    const currentBalance = await CoinCalculationEngine.getCurrentBalance(userId);

    // Get today's focus time
    const today = new Date().toISOString().split('T')[0];
    const todayStats = await db('learning_sessions')
      .where('user_id', userId)
      .where('session_date', today)
      .where('status', 'completed')
      .sum('focus_time_minutes as daily_focus_minutes')
      .first();

    // Get consecutive learning days
    const consecutiveDays = await this.getConsecutiveLearningDays(userId);

    // Get subject-specific coins
    const subjectCoins = await db('learning_sessions')
      .leftJoin('task_definitions', 'learning_sessions.task_id', 'task_definitions.task_id')
      .where('learning_sessions.user_id', userId)
      .where('learning_sessions.status', 'completed')
      .select('task_definitions.subject')
      .sum('learning_sessions.total_coins as coins')
      .groupBy('task_definitions.subject');

    const subjectCoinsMap: { [key: string]: number } = {};
    subjectCoins.forEach(item => {
      if (item.subject) {
        subjectCoinsMap[item.subject] = parseInt(item.coins || '0');
      }
    });

    return {
      totalSessions: parseInt(sessionStats?.total_sessions || '0'),
      totalCoinsEarned: parseInt(sessionStats?.total_coins_earned || '0'),
      currentBalance,
      totalFocusHours: Math.floor(parseInt(sessionStats?.total_focus_minutes || '0') / 60),
      dailyFocusHours: Math.floor(parseInt(todayStats?.daily_focus_minutes || '0') / 60),
      consecutiveDays,
      difficultTasksCompleted: parseInt(sessionStats?.difficult_tasks || '0'),
      extremeTasksCompleted: parseInt(sessionStats?.extreme_tasks || '0'),
      subjectCoins: subjectCoinsMap,
    };
  }

  /**
   * Get consecutive learning days for a user
   */
  private static async getConsecutiveLearningDays(userId: string): Promise<number> {
    const recentSessions = await db('learning_sessions')
      .where('user_id', userId)
      .where('status', 'completed')
      .select('session_date')
      .groupBy('session_date')
      .orderBy('session_date', 'desc')
      .limit(100);

    if (recentSessions.length === 0) {
      return 0;
    }

    let consecutiveDays = 1;
    const today = new Date();
    const latestSessionDate = new Date(recentSessions[0].session_date);
    
    // Check if latest session is today or yesterday
    const daysDiff = Math.floor((today.getTime() - latestSessionDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 1) {
      return 0; // Streak broken
    }
    
    // Count consecutive days
    for (let i = 1; i < recentSessions.length; i++) {
      const currentDate = new Date(recentSessions[i-1].session_date);
      const previousDate = new Date(recentSessions[i].session_date);
      const diff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diff === 1) {
        consecutiveDays++;
      } else {
        break;
      }
    }
    
    return consecutiveDays;
  }

  /**
   * Get active achievements
   */
  static async getActiveAchievements(): Promise<Achievement[]> {
    return db('achievements')
      .where('is_active', true)
      .orderBy('rarity')
      .orderBy('points');
  }

  /**
   * Get user's achievements
   */
  static async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return db('user_achievements')
      .leftJoin('achievements', 'user_achievements.achievement_id', 'achievements.achievement_id')
      .where('user_achievements.user_id', userId)
      .select([
        'user_achievements.*',
        'achievements.name',
        'achievements.description',
        'achievements.icon',
        'achievements.category',
        'achievements.rarity',
        'achievements.points',
      ])
      .orderBy('user_achievements.achieved_at', 'desc');
  }

  /**
   * Get achievement progress for a user
   */
  static async getAchievementProgress(userId: string): Promise<AchievementProgress[]> {
    const activeAchievements = await this.getActiveAchievements();
    const userAchievements = await this.getUserAchievements(userId);
    const completedIds = new Set(userAchievements.map(ua => ua.achievement_id));
    const userStats = await this.getUserStatistics(userId);

    const progress: AchievementProgress[] = [];

    for (const achievement of activeAchievements) {
      const isCompleted = completedIds.has(achievement.achievement_id);
      
      if (isCompleted) {
        progress.push({
          achievement,
          progress: 100,
          maxValue: 100,
          isCompleted: true,
        });
        continue;
      }

      // Calculate progress for incomplete achievements
      const progressData = this.calculateAchievementProgress(achievement, userStats);
      progress.push({
        achievement,
        ...progressData,
        isCompleted: false,
      });
    }

    return progress;
  }

  /**
   * Calculate progress for an achievement
   */
  private static calculateAchievementProgress(achievement: Achievement, stats: any): {
    progress: number;
    maxValue: number;
    nextMilestone?: number;
  } {
    const expression = achievement.condition_expression;
    
    // Extract target values from conditions
    if (expression.includes('total_sessions >=')) {
      const target = parseInt(expression.match(/total_sessions >= (\d+)/)?.[1] || '0');
      const current = stats.totalSessions;
      return {
        progress: Math.min((current / target) * 100, 100),
        maxValue: target,
        nextMilestone: target,
      };
    }

    if (expression.includes('total_coins_earned >=')) {
      const target = parseInt(expression.match(/total_coins_earned >= (\d+)/)?.[1] || '0');
      const current = stats.totalCoinsEarned;
      return {
        progress: Math.min((current / target) * 100, 100),
        maxValue: target,
        nextMilestone: target,
      };
    }

    if (expression.includes('consecutive_days >=')) {
      const target = parseInt(expression.match(/consecutive_days >= (\d+)/)?.[1] || '0');
      const current = stats.consecutiveDays;
      return {
        progress: Math.min((current / target) * 100, 100),
        maxValue: target,
        nextMilestone: target,
      };
    }

    if (expression.includes('current_coin_balance >=')) {
      const target = parseInt(expression.match(/current_coin_balance >= (\d+)/)?.[1] || '0');
      const current = stats.currentBalance;
      return {
        progress: Math.min((current / target) * 100, 100),
        maxValue: target,
        nextMilestone: target,
      };
    }

    // Default progress calculation
    return {
      progress: 0,
      maxValue: 100,
    };
  }

  /**
   * Create a new achievement (Admin function)
   */
  static async createAchievement(achievementData: Partial<Achievement>): Promise<Achievement> {
    const achievementId = uuidv4();
    
    const [achievement] = await db('achievements')
      .insert({
        achievement_id: achievementId,
        name: achievementData.name,
        description: achievementData.description,
        condition_expression: achievementData.condition_expression,
        icon: achievementData.icon,
        category: achievementData.category || 'general',
        rarity: achievementData.rarity || 'common',
        points: achievementData.points || 0,
        is_active: achievementData.is_active !== false,
        metadata: achievementData.metadata || {},
      })
      .returning('*');

    return achievement;
  }

  /**
   * Update achievement
   */
  static async updateAchievement(achievementId: string, updateData: Partial<Achievement>): Promise<Achievement | null> {
    const [achievement] = await db('achievements')
      .where('achievement_id', achievementId)
      .update({
        ...updateData,
        updated_at: db.fn.now(),
      })
      .returning('*');

    return achievement || null;
  }

  /**
   * Delete achievement
   */
  static async deleteAchievement(achievementId: string): Promise<boolean> {
    const result = await db('achievements')
      .where('achievement_id', achievementId)
      .del();

    return result > 0;
  }

  /**
   * Get achievement statistics
   */
  static async getAchievementStatistics(): Promise<{
    totalAchievements: number;
    completionRates: Array<{
      achievement_name: string;
      completion_rate: number;
      total_completions: number;
    }>;
    rarityDistribution: Array<{
      rarity: string;
      count: number;
    }>;
  }> {
    const totalAchievements = await db('achievements')
      .where('is_active', true)
      .count('* as count')
      .first();

    const totalUsers = await db('users')
      .where('status', 'active')
      .count('* as count')
      .first();

    const completionRates = await db('achievements')
      .leftJoin('user_achievements', 'achievements.achievement_id', 'user_achievements.achievement_id')
      .where('achievements.is_active', true)
      .select([
        'achievements.name as achievement_name',
        db.raw('COUNT(user_achievements.user_id) as total_completions'),
      ])
      .groupBy('achievements.achievement_id', 'achievements.name')
      .orderBy('total_completions', 'desc');

    const userCount = parseInt(totalUsers?.count as string || '0');
    const completionRatesWithPercentage = completionRates.map(item => ({
      achievement_name: item.achievement_name,
      completion_rate: userCount > 0 ? (parseInt(item.total_completions) / userCount) * 100 : 0,
      total_completions: parseInt(item.total_completions),
    }));

    const rarityDistribution = await db('achievements')
      .where('is_active', true)
      .select('rarity')
      .count('* as count')
      .groupBy('rarity')
      .orderBy('count', 'desc');

    return {
      totalAchievements: parseInt(totalAchievements?.count as string || '0'),
      completionRates: completionRatesWithPercentage,
      rarityDistribution: rarityDistribution.map(item => ({
        rarity: item.rarity,
        count: parseInt(item.count as string),
      })),
    };
  }

  /**
   * Trigger achievement check for all users (batch process)
   */
  static async batchCheckAchievements(): Promise<void> {
    const activeUsers = await db('users')
      .where('status', 'active')
      .select('user_id');

    console.log(`Checking achievements for ${activeUsers.length} users`);

    for (const user of activeUsers) {
      try {
        await this.checkAndAwardAchievements(user.user_id);
      } catch (error) {
        console.error(`Error checking achievements for user ${user.user_id}:`, error);
      }
    }

    console.log('Batch achievement check completed');
  }
}