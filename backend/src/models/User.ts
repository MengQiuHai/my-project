import db from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import config from '../config';
import { RewardService } from '../services/RewardService';

export interface User {
  user_id: string;
  username: string;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  bio?: string;
  preferences?: any;
  status: 'active' | 'inactive' | 'suspended';
  role: 'user' | 'admin';
  email_verified_at?: Date;
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  bio?: string;
  preferences?: any;
}

export class UserModel {
  static async create(userData: CreateUserData): Promise<User> {
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(userData.password, config.bcrypt.rounds);
    
    const [user] = await db('users')
      .insert({
        user_id: userId,
        username: userData.username,
        email: userData.email,
        password_hash: passwordHash,
        first_name: userData.first_name,
        last_name: userData.last_name,
        status: 'active',
        role: 'user',
      })
      .returning('*');
    
    // Create default rewards for new user
    try {
      await RewardService.createDefaultRewards(userId);
    } catch (error) {
      console.error('Failed to create default rewards for new user:', error);
      // Don't fail user creation if reward creation fails
    }
    
    return user;
  }

  static async findById(userId: string): Promise<User | null> {
    const user = await db('users')
      .where('user_id', userId)
      .first();
    
    return user || null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const user = await db('users')
      .where('email', email)
      .first();
    
    return user || null;
  }

  static async findByUsername(username: string): Promise<User | null> {
    const user = await db('users')
      .where('username', username)
      .first();
    
    return user || null;
  }

  static async update(userId: string, userData: UpdateUserData): Promise<User | null> {
    const [user] = await db('users')
      .where('user_id', userId)
      .update({
        ...userData,
        updated_at: db.fn.now(),
      })
      .returning('*');
    
    return user || null;
  }

  static async updatePassword(userId: string, newPassword: string): Promise<boolean> {
    const passwordHash = await bcrypt.hash(newPassword, config.bcrypt.rounds);
    
    const result = await db('users')
      .where('user_id', userId)
      .update({
        password_hash: passwordHash,
        updated_at: db.fn.now(),
      });
    
    return result > 0;
  }

  static async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  }

  static async updateLastLogin(userId: string): Promise<void> {
    await db('users')
      .where('user_id', userId)
      .update({
        last_login_at: db.fn.now(),
        updated_at: db.fn.now(),
      });
  }

  static async updateStatus(userId: string, status: 'active' | 'inactive' | 'suspended'): Promise<boolean> {
    const result = await db('users')
      .where('user_id', userId)
      .update({
        status,
        updated_at: db.fn.now(),
      });
    
    return result > 0;
  }

  static async delete(userId: string): Promise<boolean> {
    const result = await db('users')
      .where('user_id', userId)
      .del();
    
    return result > 0;
  }

  static async list(options: {
    limit?: number;
    offset?: number;
    status?: string;
    role?: string;
    search?: string;
  } = {}): Promise<{ users: User[]; total: number }> {
    const { limit = 20, offset = 0, status, role, search } = options;
    
    let query = db('users').select('*');
    let countQuery = db('users').count('* as count');
    
    if (status) {
      query = query.where('status', status);
      countQuery = countQuery.where('status', status);
    }
    
    if (role) {
      query = query.where('role', role);
      countQuery = countQuery.where('role', role);
    }
    
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where(function() {
        this.where('username', 'ilike', searchTerm)
          .orWhere('email', 'ilike', searchTerm)
          .orWhere('first_name', 'ilike', searchTerm)
          .orWhere('last_name', 'ilike', searchTerm);
      });
      countQuery = countQuery.where(function() {
        this.where('username', 'ilike', searchTerm)
          .orWhere('email', 'ilike', searchTerm)
          .orWhere('first_name', 'ilike', searchTerm)
          .orWhere('last_name', 'ilike', searchTerm);
      });
    }
    
    const users = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);
    
    const [{ count }] = await countQuery;
    
    return {
      users,
      total: parseInt(count as string),
    };
  }

  static async getUserStats(userId: string): Promise<{
    totalSessions: number;
    totalCoins: number;
    currentBalance: number;
    achievementCount: number;
    streakDays: number;
  }> {
    // 获取学习统计
    const sessionStats = await db('learning_sessions')
      .where('user_id', userId)
      .select(
        db.raw('COUNT(*) as total_sessions'),
        db.raw('SUM(total_coins) as total_coins_earned')
      )
      .first();

    // 获取当前金币余额
    const balanceResult = await db('coin_ledger')
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .select('balance_after')
      .first();

    // 获取成就数量
    const achievementCount = await db('user_achievements')
      .where('user_id', userId)
      .count('* as count')
      .first();

    // 计算连续打卡天数（简化版本）
    const recentSessions = await db('learning_sessions')
      .where('user_id', userId)
      .select('session_date')
      .groupBy('session_date')
      .orderBy('session_date', 'desc')
      .limit(100);

    let streakDays = 0;
    if (recentSessions.length > 0) {
      const today = new Date();
      let currentDate = new Date(today);
      
      for (const session of recentSessions) {
        const sessionDate = new Date(session.session_date);
        const diffTime = currentDate.getTime() - sessionDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === streakDays) {
          streakDays++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    return {
      totalSessions: parseInt(sessionStats?.total_sessions || '0'),
      totalCoins: parseInt(sessionStats?.total_coins_earned || '0'),
      currentBalance: balanceResult?.balance_after || 0,
      achievementCount: parseInt(achievementCount?.count as string || '0'),
      streakDays,
    };
  }
}