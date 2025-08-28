import db from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { CoinService } from '../services/CoinService';
import { CoinCalculationEngine } from '../services/CoinCalculationEngine';
import { AchievementService } from '../services/AchievementService';

export interface LearningSession {
  session_id: string;
  user_id: string;
  task_id: string;
  difficulty_id: string;
  session_date: string;
  focus_time_minutes: number;
  result_quantity: number;
  focus_coins: number;
  result_coins: number;
  total_coins: number;
  notes?: string;
  metadata?: any;
  status: 'completed' | 'partial' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

export interface CreateSessionData {
  user_id: string;
  task_id: string;
  difficulty_id: string;
  session_date: string;
  focus_time_minutes: number;
  result_quantity: number;
  notes?: string;
  metadata?: any;
}

export interface SessionWithDetails extends LearningSession {
  task_name: string;
  task_subject: string;
  difficulty_label: string;
  difficulty_coefficient: number;
}

export class LearningSessionModel {
  static async create(sessionData: CreateSessionData): Promise<LearningSession> {
    const sessionId = uuidv4();
    
    // 使用金币计算引擎计算金币
    const coinResult = await CoinCalculationEngine.calculateCoins({
      userId: sessionData.user_id,
      taskId: sessionData.task_id,
      difficultyId: sessionData.difficulty_id,
      focusTimeMinutes: sessionData.focus_time_minutes,
      resultQuantity: sessionData.result_quantity,
      sessionDate: sessionData.session_date,
    });
    
    const [session] = await db('learning_sessions')
      .insert({
        session_id: sessionId,
        user_id: sessionData.user_id,
        task_id: sessionData.task_id,
        difficulty_id: sessionData.difficulty_id,
        session_date: sessionData.session_date,
        focus_time_minutes: sessionData.focus_time_minutes,
        result_quantity: sessionData.result_quantity,
        focus_coins: coinResult.focusCoins,
        result_coins: coinResult.resultCoins,
        total_coins: coinResult.totalCoins,
        notes: sessionData.notes,
        metadata: sessionData.metadata || {},
        status: 'completed',
      })
      .returning('*');
    
    // 处理金币奖励
    await CoinService.processSessionReward({
      sessionId,
      userId: sessionData.user_id,
      taskId: sessionData.task_id,
      difficultyId: sessionData.difficulty_id,
      focusTimeMinutes: sessionData.focus_time_minutes,
      resultQuantity: sessionData.result_quantity,
      sessionDate: sessionData.session_date,
    });
    
    // 检查并授予成就
    try {
      await AchievementService.checkAndAwardAchievements(sessionData.user_id);
    } catch (error) {
      console.error('Error checking achievements:', error);
      // Don't fail session creation if achievement check fails
    }
    
    return session;
  }

  static async findById(sessionId: string): Promise<SessionWithDetails | null> {
    const session = await db('learning_sessions')
      .leftJoin('task_definitions', 'learning_sessions.task_id', 'task_definitions.task_id')
      .leftJoin('difficulties', 'learning_sessions.difficulty_id', 'difficulties.difficulty_id')
      .where('learning_sessions.session_id', sessionId)
      .select([
        'learning_sessions.*',
        'task_definitions.name as task_name',
        'task_definitions.subject as task_subject',
        'difficulties.label as difficulty_label',
        'difficulties.coefficient as difficulty_coefficient',
      ])
      .first();
    
    return session || null;
  }

  static async findByUserId(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      startDate?: string;
      endDate?: string;
      taskId?: string;
      subject?: string;
      status?: string;
    } = {}
  ): Promise<{ sessions: SessionWithDetails[]; total: number }> {
    const { limit = 20, offset = 0, startDate, endDate, taskId, subject, status } = options;
    
    let query = db('learning_sessions')
      .leftJoin('task_definitions', 'learning_sessions.task_id', 'task_definitions.task_id')
      .leftJoin('difficulties', 'learning_sessions.difficulty_id', 'difficulties.difficulty_id')
      .where('learning_sessions.user_id', userId)
      .select([
        'learning_sessions.*',
        'task_definitions.name as task_name',
        'task_definitions.subject as task_subject',
        'difficulties.label as difficulty_label',
        'difficulties.coefficient as difficulty_coefficient',
      ]);
    
    let countQuery = db('learning_sessions')
      .leftJoin('task_definitions', 'learning_sessions.task_id', 'task_definitions.task_id')
      .where('learning_sessions.user_id', userId)
      .count('* as count');
    
    if (startDate) {
      query = query.where('learning_sessions.session_date', '>=', startDate);
      countQuery = countQuery.where('learning_sessions.session_date', '>=', startDate);
    }
    
    if (endDate) {
      query = query.where('learning_sessions.session_date', '<=', endDate);
      countQuery = countQuery.where('learning_sessions.session_date', '<=', endDate);
    }
    
    if (taskId) {
      query = query.where('learning_sessions.task_id', taskId);
      countQuery = countQuery.where('learning_sessions.task_id', taskId);
    }
    
    if (subject) {
      query = query.where('task_definitions.subject', subject);
      countQuery = countQuery.where('task_definitions.subject', subject);
    }
    
    if (status) {
      query = query.where('learning_sessions.status', status);
      countQuery = countQuery.where('learning_sessions.status', status);
    }
    
    const sessions = await query
      .orderBy('learning_sessions.session_date', 'desc')
      .orderBy('learning_sessions.created_at', 'desc')
      .limit(limit)
      .offset(offset);
    
    const [{ count }] = await countQuery;
    
    return {
      sessions,
      total: parseInt(count as string),
    };
  }

  static async update(sessionId: string, updateData: Partial<CreateSessionData>): Promise<LearningSession | null> {
    // 如果更新了关键数据，需要重新计算金币
    if (updateData.focus_time_minutes !== undefined || 
        updateData.result_quantity !== undefined ||
        updateData.task_id !== undefined ||
        updateData.difficulty_id !== undefined) {
      
      const session = await this.findById(sessionId);
      if (!session) return null;
      
      const taskId = updateData.task_id || session.task_id;
      const difficultyId = updateData.difficulty_id || session.difficulty_id;
      const focusTime = updateData.focus_time_minutes !== undefined ? 
        updateData.focus_time_minutes : session.focus_time_minutes;
      const resultQuantity = updateData.result_quantity !== undefined ? 
        updateData.result_quantity : session.result_quantity;
      
      const task = await db('task_definitions').where('task_id', taskId).first();
      const difficulty = await db('difficulties').where('difficulty_id', difficultyId).first();
      
      if (!task || !difficulty) {
        throw new Error('Task or difficulty not found');
      }
      
      const focusCoins = Math.floor(focusTime / 30);
      const resultCoins = Math.floor(resultQuantity * task.base_coin * difficulty.coefficient);
      const totalCoins = focusCoins + resultCoins;
      
      updateData = {
        ...updateData,
        focus_coins: focusCoins,
        result_coins: resultCoins,
        total_coins: totalCoins,
      } as any;
    }
    
    const [session] = await db('learning_sessions')
      .where('session_id', sessionId)
      .update({
        ...updateData,
        updated_at: db.fn.now(),
      })
      .returning('*');
    
    return session || null;
  }

  static async delete(sessionId: string): Promise<boolean> {
    const result = await db('learning_sessions')
      .where('session_id', sessionId)
      .del();
    
    return result > 0;
  }

  static async getStatsByUser(
    userId: string,
    options: {
      startDate?: string;
      endDate?: string;
      subject?: string;
    } = {}
  ): Promise<{
    totalSessions: number;
    totalFocusTime: number;
    totalCoins: number;
    avgSessionTime: number;
    subjectStats: Array<{
      subject: string;
      sessionCount: number;
      focusTime: number;
      coins: number;
    }>;
    dailyStats: Array<{
      date: string;
      sessionCount: number;
      focusTime: number;
      coins: number;
    }>;
  }> {
    const { startDate, endDate, subject } = options;
    
    let baseQuery = db('learning_sessions')
      .leftJoin('task_definitions', 'learning_sessions.task_id', 'task_definitions.task_id')
      .where('learning_sessions.user_id', userId);
    
    if (startDate) {
      baseQuery = baseQuery.where('learning_sessions.session_date', '>=', startDate);
    }
    
    if (endDate) {
      baseQuery = baseQuery.where('learning_sessions.session_date', '<=', endDate);
    }
    
    if (subject) {
      baseQuery = baseQuery.where('task_definitions.subject', subject);
    }
    
    // 总体统计
    const overallStats = await baseQuery.clone()
      .select(
        db.raw('COUNT(*) as total_sessions'),
        db.raw('SUM(focus_time_minutes) as total_focus_time'),
        db.raw('SUM(total_coins) as total_coins'),
        db.raw('AVG(focus_time_minutes) as avg_session_time')
      )
      .first();
    
    // 按学科统计
    const subjectStats = await baseQuery.clone()
      .select([
        'task_definitions.subject',
        db.raw('COUNT(*) as session_count'),
        db.raw('SUM(focus_time_minutes) as focus_time'),
        db.raw('SUM(total_coins) as coins'),
      ])
      .groupBy('task_definitions.subject')
      .orderBy('coins', 'desc');
    
    // 按日期统计
    const dailyStats = await baseQuery.clone()
      .select([
        'learning_sessions.session_date as date',
        db.raw('COUNT(*) as session_count'),
        db.raw('SUM(focus_time_minutes) as focus_time'),
        db.raw('SUM(total_coins) as coins'),
      ])
      .groupBy('learning_sessions.session_date')
      .orderBy('learning_sessions.session_date', 'desc')
      .limit(30);
    
    return {
      totalSessions: parseInt(overallStats?.total_sessions || '0'),
      totalFocusTime: parseInt(overallStats?.total_focus_time || '0'),
      totalCoins: parseInt(overallStats?.total_coins || '0'),
      avgSessionTime: parseFloat(overallStats?.avg_session_time || '0'),
      subjectStats: subjectStats.map(stat => ({
        subject: stat.subject,
        sessionCount: parseInt(stat.session_count),
        focusTime: parseInt(stat.focus_time),
        coins: parseInt(stat.coins),
      })),
      dailyStats: dailyStats.map(stat => ({
        date: stat.date,
        sessionCount: parseInt(stat.session_count),
        focusTime: parseInt(stat.focus_time),
        coins: parseInt(stat.coins),
      })),
    };
  }
}