import db from '../config/database';

export interface LearningTrendData {
  date: string;
  sessions: number;
  focusTime: number;
  coins: number;
  efficiency: number;
}

export interface SubjectAnalysis {
  subject: string;
  sessionCount: number;
  totalFocusTime: number;
  totalCoins: number;
  avgSessionTime: number;
  efficiency: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface PerformanceMetrics {
  avgDailyFocus: number;
  avgDailyCoins: number;
  productivity: number;
  consistency: number;
  improvement: number;
}

export interface DetailedReport {
  overview: {
    totalSessions: number;
    totalFocusTime: number;
    totalCoinsEarned: number;
    avgEfficiency: number;
    studyStreak: number;
  };
  trends: LearningTrendData[];
  subjects: SubjectAnalysis[];
  performance: PerformanceMetrics;
  recommendations: string[];
  insights: string[];
}

export class AnalyticsService {
  /**
   * Get comprehensive learning analytics for a user
   */
  static async getUserAnalytics(
    userId: string,
    period: string = '30d'
  ): Promise<DetailedReport> {
    const days = this.parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      overview,
      trends,
      subjects,
      performance,
    ] = await Promise.all([
      this.getOverviewMetrics(userId, startDate),
      this.getLearningTrends(userId, startDate, days),
      this.getSubjectAnalysis(userId, startDate),
      this.getPerformanceMetrics(userId, startDate, days),
    ]);

    const recommendations = await this.generateRecommendations(userId, {
      overview,
      subjects,
      performance,
      trends,
    });

    const insights = this.generateInsights({
      overview,
      subjects,
      performance,
      trends,
    });

    return {
      overview,
      trends,
      subjects,
      performance,
      recommendations,
      insights,
    };
  }

  /**
   * Get overview metrics
   */
  private static async getOverviewMetrics(userId: string, startDate: Date) {
    const metrics = await db('learning_sessions')
      .where('user_id', userId)
      .where('created_at', '>=', startDate.toISOString())
      .where('status', 'completed')
      .select(
        db.raw('COUNT(*) as total_sessions'),
        db.raw('SUM(focus_time_minutes) as total_focus_time'),
        db.raw('SUM(total_coins) as total_coins_earned'),
        db.raw('AVG(CASE WHEN focus_time_minutes > 0 THEN total_coins::float / focus_time_minutes * 60 ELSE 0 END) as avg_efficiency')
      )
      .first();

    // Get study streak
    const studyStreak = await this.getStudyStreak(userId);

    return {
      totalSessions: parseInt(metrics?.total_sessions || '0'),
      totalFocusTime: parseInt(metrics?.total_focus_time || '0'),
      totalCoinsEarned: parseInt(metrics?.total_coins_earned || '0'),
      avgEfficiency: parseFloat(metrics?.avg_efficiency || '0'),
      studyStreak,
    };
  }

  /**
   * Get learning trends over time
   */
  private static async getLearningTrends(
    userId: string, 
    startDate: Date, 
    days: number
  ): Promise<LearningTrendData[]> {
    const trends = await db('learning_sessions')
      .where('user_id', userId)
      .where('session_date', '>=', startDate.toISOString().split('T')[0])
      .where('status', 'completed')
      .select([
        'session_date as date',
        db.raw('COUNT(*) as sessions'),
        db.raw('SUM(focus_time_minutes) as focus_time'),
        db.raw('SUM(total_coins) as coins'),
        db.raw('AVG(CASE WHEN focus_time_minutes > 0 THEN total_coins::float / focus_time_minutes * 60 ELSE 0 END) as efficiency')
      ])
      .groupBy('session_date')
      .orderBy('session_date', 'asc');

    // Fill missing dates with zeros
    const trendMap = new Map(trends.map(t => [t.date, t]));\n    const result: LearningTrendData[] = [];

    for (let i = 0; i < days; i++) {\n      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const trend = trendMap.get(dateStr);
      result.push({
        date: dateStr,
        sessions: trend ? parseInt(trend.sessions) : 0,
        focusTime: trend ? parseInt(trend.focus_time) : 0,
        coins: trend ? parseInt(trend.coins) : 0,
        efficiency: trend ? parseFloat(trend.efficiency) : 0,
      });
    }

    return result;
  }

  /**
   * Get subject analysis
   */
  private static async getSubjectAnalysis(
    userId: string,
    startDate: Date
  ): Promise<SubjectAnalysis[]> {
    const subjects = await db('learning_sessions')
      .leftJoin('task_definitions', 'learning_sessions.task_id', 'task_definitions.task_id')
      .where('learning_sessions.user_id', userId)
      .where('learning_sessions.created_at', '>=', startDate.toISOString())
      .where('learning_sessions.status', 'completed')
      .select([
        'task_definitions.subject',
        db.raw('COUNT(*) as session_count'),
        db.raw('SUM(learning_sessions.focus_time_minutes) as total_focus_time'),
        db.raw('SUM(learning_sessions.total_coins) as total_coins'),
        db.raw('AVG(learning_sessions.focus_time_minutes) as avg_session_time'),
        db.raw('AVG(CASE WHEN learning_sessions.focus_time_minutes > 0 THEN learning_sessions.total_coins::float / learning_sessions.focus_time_minutes * 60 ELSE 0 END) as efficiency')
      ])
      .groupBy('task_definitions.subject')
      .orderBy('total_coins', 'desc');

    // Calculate trends for each subject
    const subjectsWithTrends = await Promise.all(
      subjects.map(async (subject) => {
        const trend = await this.getSubjectTrend(userId, subject.subject, startDate);
        
        return {
          subject: subject.subject,
          sessionCount: parseInt(subject.session_count),
          totalFocusTime: parseInt(subject.total_focus_time),
          totalCoins: parseInt(subject.total_coins),
          avgSessionTime: parseFloat(subject.avg_session_time),
          efficiency: parseFloat(subject.efficiency),
          trend,
        };
      })
    );

    return subjectsWithTrends;
  }

  /**
   * Get performance metrics
   */
  private static async getPerformanceMetrics(
    userId: string,
    startDate: Date,
    days: number
  ): Promise<PerformanceMetrics> {
    const metrics = await db('learning_sessions')
      .where('user_id', userId)
      .where('created_at', '>=', startDate.toISOString())
      .where('status', 'completed')
      .select(
        db.raw('AVG(focus_time_minutes) as avg_daily_focus'),
        db.raw('AVG(total_coins) as avg_daily_coins'),
        db.raw('COUNT(DISTINCT session_date) as active_days')
      )
      .first();

    const avgDailyFocus = parseFloat(metrics?.avg_daily_focus || '0');
    const avgDailyCoins = parseFloat(metrics?.avg_daily_coins || '0');
    const activeDays = parseInt(metrics?.active_days || '0');

    // Calculate performance scores
    const productivity = this.calculateProductivityScore(avgDailyFocus, avgDailyCoins);
    const consistency = (activeDays / days) * 100;
    const improvement = await this.calculateImprovementScore(userId, startDate);

    return {
      avgDailyFocus,
      avgDailyCoins,
      productivity,
      consistency,
      improvement,
    };
  }

  /**
   * Get study streak
   */
  private static async getStudyStreak(userId: string): Promise<number> {
    const recentSessions = await db('learning_sessions')
      .where('user_id', userId)
      .where('status', 'completed')
      .select('session_date')
      .groupBy('session_date')
      .orderBy('session_date', 'desc')
      .limit(100);

    if (recentSessions.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < recentSessions.length; i++) {
      const sessionDate = new Date(recentSessions[i].session_date);
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - streak);
      
      if (sessionDate.toDateString() === expectedDate.toDateString()) {
        streak++;
      } else if (streak === 0 && i === 0) {
        // Check if it's yesterday (streak broken today)
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (sessionDate.toDateString() === yesterday.toDateString()) {
          streak = 1;
        }
        break;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Get subject trend
   */
  private static async getSubjectTrend(
    userId: string,
    subject: string,
    startDate: Date
  ): Promise<'increasing' | 'decreasing' | 'stable'> {
    const midDate = new Date(startDate);
    midDate.setDate(midDate.getDate() + 15);

    const [firstHalf, secondHalf] = await Promise.all([
      db('learning_sessions')
        .leftJoin('task_definitions', 'learning_sessions.task_id', 'task_definitions.task_id')
        .where('learning_sessions.user_id', userId)
        .where('task_definitions.subject', subject)
        .where('learning_sessions.created_at', '>=', startDate.toISOString())
        .where('learning_sessions.created_at', '<', midDate.toISOString())
        .where('learning_sessions.status', 'completed')
        .avg('learning_sessions.total_coins as avg_coins')
        .first(),
      
      db('learning_sessions')
        .leftJoin('task_definitions', 'learning_sessions.task_id', 'task_definitions.task_id')
        .where('learning_sessions.user_id', userId)
        .where('task_definitions.subject', subject)
        .where('learning_sessions.created_at', '>=', midDate.toISOString())
        .where('learning_sessions.status', 'completed')
        .avg('learning_sessions.total_coins as avg_coins')
        .first()
    ]);

    const firstAvg = parseFloat(firstHalf?.avg_coins || '0');
    const secondAvg = parseFloat(secondHalf?.avg_coins || '0');

    if (secondAvg > firstAvg * 1.1) return 'increasing';
    if (secondAvg < firstAvg * 0.9) return 'decreasing';
    return 'stable';
  }

  /**
   * Calculate productivity score
   */
  private static calculateProductivityScore(avgFocus: number, avgCoins: number): number {
    // Normalize and combine focus time and coin efficiency
    const focusScore = Math.min(avgFocus / 120, 1) * 50; // Max 2 hours = 50 points
    const coinsScore = Math.min(avgCoins / 50, 1) * 50; // Max 50 coins = 50 points
    return Math.round(focusScore + coinsScore);
  }

  /**
   * Calculate improvement score
   */
  private static async calculateImprovementScore(userId: string, startDate: Date): Promise<number> {
    const compareDate = new Date(startDate);
    compareDate.setDate(compareDate.getDate() - 30); // Compare with 30 days before

    const [currentPeriod, previousPeriod] = await Promise.all([
      db('learning_sessions')
        .where('user_id', userId)
        .where('created_at', '>=', startDate.toISOString())
        .where('status', 'completed')
        .avg('total_coins as avg_coins')
        .first(),
      
      db('learning_sessions')
        .where('user_id', userId)
        .where('created_at', '>=', compareDate.toISOString())
        .where('created_at', '<', startDate.toISOString())
        .where('status', 'completed')
        .avg('total_coins as avg_coins')
        .first()
    ]);

    const currentAvg = parseFloat(currentPeriod?.avg_coins || '0');
    const previousAvg = parseFloat(previousPeriod?.avg_coins || '0');

    if (previousAvg === 0) return 0;
    
    const improvement = ((currentAvg - previousAvg) / previousAvg) * 100;
    return Math.max(-100, Math.min(100, improvement)); // Clamp between -100 and 100
  }

  /**
   * Generate personalized recommendations
   */
  private static async generateRecommendations(
    userId: string,
    data: {
      overview: any;
      subjects: SubjectAnalysis[];
      performance: PerformanceMetrics;
      trends: LearningTrendData[];
    }
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Consistency recommendations
    if (data.performance.consistency < 50) {
      recommendations.push('Try to study more consistently. Aim for at least 15 minutes daily to build a habit.');
    }

    // Focus time recommendations
    if (data.performance.avgDailyFocus < 30) {
      recommendations.push('Consider increasing your daily focus time. Even small increases can lead to better results.');
    }

    // Subject balance recommendations
    const sortedSubjects = data.subjects.sort((a, b) => b.totalCoins - a.totalCoins);
    if (sortedSubjects.length > 1) {
      const topSubject = sortedSubjects[0];
      const weakestSubject = sortedSubjects[sortedSubjects.length - 1];
      
      if (topSubject.totalCoins > weakestSubject.totalCoins * 3) {
        recommendations.push(`Consider allocating more time to ${weakestSubject.subject} to maintain balanced progress.`);
      }
    }

    // Efficiency recommendations
    const lowEfficiencySubjects = data.subjects.filter(s => s.efficiency < data.overview.avgEfficiency * 0.8);
    if (lowEfficiencySubjects.length > 0) {
      recommendations.push(`Focus on improving efficiency in: ${lowEfficiencySubjects.map(s => s.subject).join(', ')}.`);
    }

    // Trend-based recommendations
    const decliningSubjects = data.subjects.filter(s => s.trend === 'decreasing');
    if (decliningSubjects.length > 0) {
      recommendations.push(`Pay attention to declining performance in: ${decliningSubjects.map(s => s.subject).join(', ')}.`);
    }

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }

  /**
   * Generate insights
   */
  private static generateInsights(data: {
    overview: any;
    subjects: SubjectAnalysis[];
    performance: PerformanceMetrics;
    trends: LearningTrendData[];
  }): string[] {
    const insights: string[] = [];

    // Performance insights
    if (data.performance.improvement > 20) {
      insights.push('🚀 Your performance has significantly improved! Keep up the great work.');
    } else if (data.performance.improvement < -20) {
      insights.push('📉 Your performance has declined recently. Consider reviewing your study methods.');
    }

    // Consistency insights
    if (data.performance.consistency > 80) {
      insights.push('🎯 Excellent consistency! Your regular study habits are paying off.');
    } else if (data.performance.consistency < 30) {
      insights.push('⏰ Improving consistency could significantly boost your progress.');
    }

    // Subject insights
    const bestSubject = data.subjects.reduce((best, current) => 
      current.efficiency > best.efficiency ? current : best, data.subjects[0]);
    
    if (bestSubject) {
      insights.push(`💎 ${bestSubject.subject} is your strongest subject with ${bestSubject.efficiency.toFixed(1)} coins/hour efficiency.`);
    }

    // Efficiency insights
    if (data.overview.avgEfficiency > 30) {
      insights.push('⚡ Your learning efficiency is above average! You\'re making great progress.');
    }

    // Streak insights
    if (data.overview.studyStreak > 7) {
      insights.push(`🔥 Amazing ${data.overview.studyStreak}-day study streak! Consistency is key to success.`);
    }

    return insights.slice(0, 5);
  }

  /**
   * Parse period string to days
   */
  private static parsePeriod(period: string): number {
    const match = period.match(/^(\\d+)([dwmy])$/);
    if (!match) return 30;

    const [, num, unit] = match;
    const value = parseInt(num);

    switch (unit) {
      case 'd': return value;
      case 'w': return value * 7;
      case 'm': return value * 30;
      case 'y': return value * 365;
      default: return 30;
    }
  }

  /**
   * Get comparative analytics
   */
  static async getComparativeAnalytics(userId: string): Promise<{
    userRank: number;
    totalUsers: number;
    percentile: number;
    comparisons: {
      avgFocusTime: { user: number; average: number; };
      avgCoins: { user: number; average: number; };
      streak: { user: number; average: number; };
    };
  }> {
    // Get user stats
    const userStats = await db('learning_sessions')
      .where('user_id', userId)
      .where('status', 'completed')
      .select(
        db.raw('AVG(focus_time_minutes) as avg_focus'),
        db.raw('AVG(total_coins) as avg_coins'),
        db.raw('COUNT(DISTINCT session_date) as active_days')
      )
      .first();

    const userStreak = await this.getStudyStreak(userId);

    // Get global averages
    const globalStats = await db('learning_sessions')
      .where('status', 'completed')
      .select(
        db.raw('AVG(focus_time_minutes) as avg_focus'),
        db.raw('AVG(total_coins) as avg_coins')
      )
      .first();

    // Get user ranking by total coins
    const userRanking = await db('learning_sessions')
      .select('user_id')
      .sum('total_coins as total_coins')
      .groupBy('user_id')
      .orderBy('total_coins', 'desc');

    const userRank = userRanking.findIndex(u => u.user_id === userId) + 1;
    const totalUsers = userRanking.length;
    const percentile = totalUsers > 0 ? ((totalUsers - userRank + 1) / totalUsers) * 100 : 0;

    return {
      userRank: userRank || totalUsers + 1,
      totalUsers,
      percentile: Math.round(percentile),
      comparisons: {
        avgFocusTime: {
          user: parseFloat(userStats?.avg_focus || '0'),
          average: parseFloat(globalStats?.avg_focus || '0'),
        },
        avgCoins: {
          user: parseFloat(userStats?.avg_coins || '0'),
          average: parseFloat(globalStats?.avg_coins || '0'),
        },
        streak: {
          user: userStreak,
          average: 3.5, // This could be calculated from all users
        },
      },
    };
  }

  /**
   * Export user data
   */
  static async exportUserData(userId: string, format: 'csv' | 'json' = 'json'): Promise<any> {
    const [sessions, coinHistory, achievements, redemptions] = await Promise.all([
      db('learning_sessions')
        .leftJoin('task_definitions', 'learning_sessions.task_id', 'task_definitions.task_id')
        .leftJoin('difficulties', 'learning_sessions.difficulty_id', 'difficulties.difficulty_id')
        .where('learning_sessions.user_id', userId)
        .select([
          'learning_sessions.*',
          'task_definitions.name as task_name',
          'task_definitions.subject',
          'difficulties.label as difficulty',
        ])
        .orderBy('learning_sessions.created_at', 'desc'),
      
      db('coin_ledger')
        .where('user_id', userId)
        .orderBy('created_at', 'desc'),
      
      db('user_achievements')
        .leftJoin('achievements', 'user_achievements.achievement_id', 'achievements.achievement_id')
        .where('user_achievements.user_id', userId)
        .select([
          'user_achievements.*',
          'achievements.name',
          'achievements.description',
          'achievements.points',
        ]),
      
      db('redemptions')
        .leftJoin('rewards', 'redemptions.reward_id', 'rewards.reward_id')
        .where('redemptions.user_id', userId)
        .select([
          'redemptions.*',
          'rewards.name as reward_name',
        ])
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      userId,
      sessions,
      coinHistory,
      achievements,
      redemptions,
    };

    if (format === 'csv') {
      // Convert to CSV format (simplified)
      return {
        sessions: this.convertToCSV(sessions),
        coinHistory: this.convertToCSV(coinHistory),
        achievements: this.convertToCSV(achievements),
        redemptions: this.convertToCSV(redemptions),
      };
    }

    return exportData;
  }

  /**
   * Convert data to CSV format
   */
  private static convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
      headers.map(header => 
        JSON.stringify(row[header] || '')
      ).join(',')
    );

    return [headers.join(','), ...rows].join('\\n');
  }
}