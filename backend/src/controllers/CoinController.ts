import { Response } from 'express';
import { CoinService } from '../services/CoinService';
import { CoinCalculationEngine } from '../services/CoinCalculationEngine';
import { ResponseHelper } from '../utils/response';
import { AppError, asyncHandler } from '../middleware/error';
import { AuthenticatedRequest } from '../middleware/auth';

export class CoinController {
  /**
   * 获取用户金币摘要
   */
  static getSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;
    const { days = 30 } = req.query;

    const summary = await CoinService.getCoinSummary(userId, Number(days));
    
    ResponseHelper.success(res, summary, 'Coin summary retrieved successfully');
  });

  /**
   * 获取用户当前金币余额
   */
  static getBalance = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;

    const balance = await CoinCalculationEngine.getCurrentBalance(userId);
    
    ResponseHelper.success(res, { balance }, 'Current balance retrieved successfully');
  });

  /**
   * 获取金币历史记录
   */
  static getHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      changeType,
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const result = await CoinCalculationEngine.getCoinHistory(userId, {
      limit: Number(limit),
      offset,
      startDate: startDate as string,
      endDate: endDate as string,
      changeType: changeType as string,
    });

    ResponseHelper.paginated(
      res,
      result.records,
      Number(page),
      Number(limit),
      result.total,
      'Coin history retrieved successfully'
    );
  });

  /**
   * 获取用户金币效率统计
   */
  static getEfficiency = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;
    const { days = 7 } = req.query;

    const efficiency = await CoinService.calculateCoinEfficiency(userId, Number(days));
    
    ResponseHelper.success(res, efficiency, 'Coin efficiency retrieved successfully');
  });

  /**
   * 获取用户排行榜位置
   */
  static getRanking = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;

    const ranking = await CoinService.getUserRanking(userId);
    
    ResponseHelper.success(res, ranking, 'User ranking retrieved successfully');
  });

  /**
   * 获取金币排行榜
   */
  static getLeaderboard = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { limit = 10 } = req.query;

    const leaderboard = await CoinService.getLeaderboard(Number(limit));
    
    ResponseHelper.success(res, leaderboard, 'Leaderboard retrieved successfully');
  });

  /**
   * 预计算金币（用于预览）
   */
  static previewCalculation = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;
    const {
      taskId,
      difficultyId,
      focusTimeMinutes,
      resultQuantity,
      sessionDate,
    } = req.body;

    try {
      const calculation = await CoinCalculationEngine.calculateCoins({
        userId,
        taskId,
        difficultyId,
        focusTimeMinutes,
        resultQuantity,
        sessionDate: sessionDate || new Date().toISOString().split('T')[0],
      });

      ResponseHelper.success(res, calculation, 'Coin calculation preview completed');
    } catch (error: any) {
      if (error.message.includes('not found')) {
        throw new AppError('Invalid task or difficulty ID', 400);
      }
      throw error;
    }
  });

  /**
   * 管理员调整金币 (需要管理员权限)
   */
  static adjustCoins = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const adminId = req.user!.user_id;
    const { userId, amount, reason } = req.body;

    // 检查管理员权限
    if (req.user!.role !== 'admin') {
      throw new AppError('Admin privileges required', 403);
    }

    await CoinService.adjustCoins(userId, amount, reason, adminId);
    
    ResponseHelper.success(res, null, 'Coins adjusted successfully');
  });

  /**
   * 批量计算多个会话的金币
   */
  static batchCalculate = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;
    const { sessions } = req.body;

    if (!Array.isArray(sessions) || sessions.length === 0) {
      throw new AppError('Sessions array is required', 400);
    }

    if (sessions.length > 50) {
      throw new AppError('Maximum 50 sessions allowed per batch', 400);
    }

    // 为每个会话添加用户ID
    const sessionsWithUserId = sessions.map(session => ({
      ...session,
      userId,
    }));

    const calculations = await CoinCalculationEngine.batchCalculateCoins(sessionsWithUserId);
    
    ResponseHelper.success(res, calculations, 'Batch calculation completed');
  });

  /**
   * 获取金币统计图表数据
   */
  static getChartData = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;
    const { period = '7d', type = 'daily' } = req.query;

    let days: number;
    switch (period) {
      case '7d':
        days = 7;
        break;
      case '30d':
        days = 30;
        break;
      case '90d':
        days = 90;
        break;
      default:
        days = 7;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 按日期分组获取金币变化
    const chartData = await CoinCalculationEngine.getCoinHistory(userId, {
      startDate: startDate.toISOString(),
      limit: 1000,
    });

    // 处理数据为图表格式
    const processedData = this.processChartData(chartData.records, type as string, days);

    ResponseHelper.success(res, processedData, 'Chart data retrieved successfully');
  });

  /**
   * 处理图表数据
   */
  private static processChartData(records: any[], type: string, days: number): any[] {
    const data: any[] = [];
    
    if (type === 'daily') {
      // 按日期分组
      const dailyData = new Map();
      
      records.forEach(record => {
        const date = new Date(record.created_at).toISOString().split('T')[0];
        
        if (!dailyData.has(date)) {
          dailyData.set(date, {
            date,
            earned: 0,
            spent: 0,
            balance: record.balance_after,
          });
        }
        
        const dayData = dailyData.get(date);
        
        if (record.amount > 0) {
          dayData.earned += record.amount;
        } else {
          dayData.spent += Math.abs(record.amount);
        }
      });
      
      // 填充缺失的日期
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        if (!dailyData.has(dateStr)) {
          dailyData.set(dateStr, {
            date: dateStr,
            earned: 0,
            spent: 0,
            balance: 0,
          });
        }
      }
      
      data.push(...Array.from(dailyData.values()).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      ));
    }
    
    return data;
  }
}