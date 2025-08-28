import db from '../config/database';
import { CoinCalculationEngine } from './CoinCalculationEngine';
import cron from 'node-cron';

export interface DecayRule {
  rule_id: string;
  name: string;
  description?: string;
  threshold_days: number;
  decay_rate: number;
  decay_type: 'percentage' | 'fixed';
  applies_to: 'all' | 'subject' | 'task_type';
  scope_value?: string;
  is_active: boolean;
  priority: number;
  metadata?: any;
}

export interface DecayCalculation {
  userId: string;
  originalAmount: number;
  decayAmount: number;
  remainingAmount: number;
  rule: DecayRule;
  appliedAt: Date;
}

export class CoinDecayService {
  private static isSchedulerRunning = false;

  /**
   * 启动衰减调度器
   */
  static startScheduler(): void {
    if (this.isSchedulerRunning) {
      console.log('Coin decay scheduler is already running');
      return;
    }

    // 每天凌晨2点执行衰减计算
    cron.schedule('0 2 * * *', async () => {
      console.log('Starting daily coin decay calculation...');
      try {
        await this.executeDecayProcess();
        console.log('Daily coin decay calculation completed');
      } catch (error) {
        console.error('Error in coin decay calculation:', error);
      }
    });

    // 每小时检查一次（用于测试和紧急情况）
    cron.schedule('0 * * * *', async () => {
      const shouldRun = await this.shouldRunHourlyDecay();
      if (shouldRun) {
        console.log('Running hourly decay check...');
        try {
          await this.executeDecayProcess();
        } catch (error) {
          console.error('Error in hourly decay check:', error);
        }
      }
    });

    this.isSchedulerRunning = true;
    console.log('Coin decay scheduler started');
  }

  /**
   * 停止衰减调度器
   */
  static stopScheduler(): void {
    this.isSchedulerRunning = false;
    console.log('Coin decay scheduler stopped');
  }

  /**
   * 执行衰减过程
   */
  static async executeDecayProcess(): Promise<void> {
    const activeUsers = await this.getActiveUsers();
    const decayRules = await this.getActiveDecayRules();

    console.log(`Processing decay for ${activeUsers.length} users with ${decayRules.length} rules`);

    for (const user of activeUsers) {
      try {
        await this.processUserDecay(user.user_id, decayRules);
      } catch (error) {
        console.error(`Error processing decay for user ${user.user_id}:`, error);
      }
    }
  }

  /**
   * 处理单个用户的衰减
   */
  static async processUserDecay(userId: string, decayRules: DecayRule[]): Promise<void> {
    const userSessions = await this.getUserSessionsForDecay(userId);
    
    for (const rule of decayRules) {
      const applicableSessions = this.filterSessionsByRule(userSessions, rule);
      
      for (const session of applicableSessions) {
        const daysSinceSession = this.getDaysSince(session.session_date);
        
        if (daysSinceSession >= rule.threshold_days) {
          await this.applyDecayToSession(userId, session, rule);
        }
      }
    }
  }

  /**
   * 对会话应用衰减
   */
  static async applyDecayToSession(
    userId: string,
    session: any,
    rule: DecayRule
  ): Promise<void> {
    // 检查是否已经对此会话应用过衰减
    const existingDecay = await db('coin_ledger')
      .where('user_id', userId)
      .where('change_type', 'decayed')
      .where('reference_id', session.session_id)
      .whereRaw('metadata->>\\\"rule_id\\\" = ?', [rule.rule_id])
      .first();

    if (existingDecay) {
      return; // 已经衰减过了
    }

    let decayAmount = 0;

    if (rule.decay_type === 'percentage') {
      decayAmount = Math.floor(session.total_coins * rule.decay_rate);
    } else {
      decayAmount = rule.decay_rate;
    }

    // 确保衰减金额不超过会话原有金币
    decayAmount = Math.min(decayAmount, session.total_coins);

    if (decayAmount > 0) {
      // 记录衰减
      await CoinCalculationEngine.recordCoinTransaction(
        userId,
        -decayAmount,
        'decayed',
        'session_decay',
        session.session_id,
        `知识遗忘衰减 - ${rule.name}`,
        {
          rule_id: rule.rule_id,
          session_date: session.session_date,
          days_since_session: this.getDaysSince(session.session_date),
          original_coins: session.total_coins,
          decay_rate: rule.decay_rate,
          decay_type: rule.decay_type,
        }
      );

      console.log(`Applied decay: User ${userId}, Session ${session.session_id}, Amount: -${decayAmount}`);
    }
  }

  /**
   * 获取活跃用户列表
   */
  private static async getActiveUsers(): Promise<Array<{ user_id: string }>> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return db('users')
      .select('user_id')
      .where('status', 'active')
      .where('last_login_at', '>=', thirtyDaysAgo.toISOString())
      .orWhereExists(function() {
        this.select('*')
          .from('learning_sessions')
          .whereRaw('learning_sessions.user_id = users.user_id')
          .where('created_at', '>=', thirtyDaysAgo.toISOString());
      });
  }

  /**
   * 获取活跃的衰减规则
   */
  private static async getActiveDecayRules(): Promise<DecayRule[]> {
    return db('coin_decay_rules')
      .where('is_active', true)
      .orderBy('priority', 'desc');
  }

  /**
   * 获取用户的会话数据用于衰减计算
   */
  private static async getUserSessionsForDecay(userId: string): Promise<any[]> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    return db('learning_sessions')
      .leftJoin('task_definitions', 'learning_sessions.task_id', 'task_definitions.task_id')
      .select([
        'learning_sessions.session_id',
        'learning_sessions.session_date',
        'learning_sessions.total_coins',
        'task_definitions.subject',
        'task_definitions.task_type',
      ])
      .where('learning_sessions.user_id', userId)
      .where('learning_sessions.status', 'completed')
      .where('learning_sessions.total_coins', '>', 0)
      .where('learning_sessions.session_date', '>=', ninetyDaysAgo.toISOString().split('T')[0]);
  }

  /**
   * 根据规则过滤会话
   */
  private static filterSessionsByRule(sessions: any[], rule: DecayRule): any[] {
    return sessions.filter(session => {
      switch (rule.applies_to) {
        case 'subject':
          return session.subject === rule.scope_value;
        case 'task_type':
          return session.task_type === rule.scope_value;
        case 'all':
        default:
          return true;
      }
    });
  }

  /**
   * 计算距离指定日期的天数
   */
  private static getDaysSince(dateString: string): number {
    const sessionDate = new Date(dateString);
    const today = new Date();
    const timeDiff = today.getTime() - sessionDate.getTime();
    return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  }

  /**
   * 检查是否应该执行每小时衰减
   */
  private static async shouldRunHourlyDecay(): Promise<boolean> {
    // 检查是否有紧急衰减规则或系统设置
    const emergencyRule = await db('coin_decay_rules')
      .where('is_active', true)
      .whereRaw('metadata->>\\\"emergency\\\" = ?', ['true'])
      .first();

    return !!emergencyRule;
  }

  /**
   * 手动触发衰减（用于测试）
   */
  static async triggerDecay(userId?: string): Promise<void> {
    console.log('Manually triggering decay process...');
    
    if (userId) {
      // 只处理指定用户
      const decayRules = await this.getActiveDecayRules();
      await this.processUserDecay(userId, decayRules);
    } else {
      // 处理所有用户
      await this.executeDecayProcess();
    }
  }

  /**
   * 获取用户的衰减历史
   */
  static async getDecayHistory(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<{ records: any[]; total: number }> {
    const { limit = 20, offset = 0, startDate, endDate } = options;

    let query = db('coin_ledger')
      .where('user_id', userId)
      .where('change_type', 'decayed');

    let countQuery = db('coin_ledger')
      .where('user_id', userId)
      .where('change_type', 'decayed')
      .count('* as count');

    if (startDate) {
      query = query.where('created_at', '>=', startDate);
      countQuery = countQuery.where('created_at', '>=', startDate);
    }

    if (endDate) {
      query = query.where('created_at', '<=', endDate);
      countQuery = countQuery.where('created_at', '<=', endDate);
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
   * 获取衰减统计
   */
  static async getDecayStatistics(userId: string, days: number = 30): Promise<{
    totalDecayed: number;
    decayCount: number;
    avgDecayPerDay: number;
    decayByRule: Array<{
      ruleName: string;
      amount: number;
      count: number;
    }>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 总衰减金币
    const totalDecayResult = await db('coin_ledger')
      .where('user_id', userId)
      .where('change_type', 'decayed')
      .where('created_at', '>=', startDate.toISOString())
      .sum('amount as total')
      .count('* as count')
      .first();

    const totalDecayed = Math.abs(parseInt(totalDecayResult?.total || '0'));
    const decayCount = parseInt(totalDecayResult?.count as string || '0');
    const avgDecayPerDay = totalDecayed / days;

    // 按规则分组统计
    const decayByRule = await db('coin_ledger')
      .where('user_id', userId)
      .where('change_type', 'decayed')
      .where('created_at', '>=', startDate.toISOString())
      .select(
        db.raw('metadata->>\\\"rule_id\\\" as rule_id'),
        db.raw('SUM(ABS(amount)) as amount'),
        db.raw('COUNT(*) as count')
      )
      .groupBy(db.raw('metadata->>\\\"rule_id\\\"'));

    // 获取规则名称
    const rulesWithNames = await Promise.all(
      decayByRule.map(async (item) => {
        if (item.rule_id) {
          const rule = await db('coin_decay_rules')
            .where('rule_id', item.rule_id)
            .select('name')
            .first();
          
          return {
            ruleName: rule?.name || 'Unknown Rule',
            amount: parseInt(item.amount),
            count: parseInt(item.count),
          };
        }
        return {
          ruleName: 'Unknown',
          amount: parseInt(item.amount),
          count: parseInt(item.count),
        };
      })
    );

    return {
      totalDecayed,
      decayCount,
      avgDecayPerDay: Math.round(avgDecayPerDay * 100) / 100,
      decayByRule: rulesWithNames,
    };
  }

  /**
   * 预测用户未来的衰减
   */
  static async predictDecay(userId: string, days: number = 7): Promise<Array<{
    date: string;
    predictedDecay: number;
    affectedSessions: number;
  }>> {
    const decayRules = await this.getActiveDecayRules();
    const userSessions = await this.getUserSessionsForDecay(userId);
    
    const predictions: Array<{
      date: string;
      predictedDecay: number;
      affectedSessions: number;
    }> = [];

    for (let i = 1; i <= days; i++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i);
      const dateString = futureDate.toISOString().split('T')[0];

      let predictedDecay = 0;
      let affectedSessions = 0;

      for (const rule of decayRules) {
        const applicableSessions = this.filterSessionsByRule(userSessions, rule);
        
        for (const session of applicableSessions) {
          const daysSinceSession = this.getDaysSince(session.session_date) + i;
          
          if (daysSinceSession >= rule.threshold_days) {
            // 检查是否已经衰减过
            const hasDecayed = await db('coin_ledger')
              .where('user_id', userId)
              .where('change_type', 'decayed')
              .where('reference_id', session.session_id)
              .whereRaw('metadata->>\\\"rule_id\\\" = ?', [rule.rule_id])
              .first();

            if (!hasDecayed) {
              let decayAmount = 0;
              if (rule.decay_type === 'percentage') {
                decayAmount = Math.floor(session.total_coins * rule.decay_rate);
              } else {
                decayAmount = rule.decay_rate;
              }
              
              predictedDecay += Math.min(decayAmount, session.total_coins);
              affectedSessions++;
            }
          }
        }
      }

      predictions.push({
        date: dateString,
        predictedDecay,
        affectedSessions,
      });
    }

    return predictions;
  }
}