import { Response } from 'express';
import { CoinDecayService } from '../services/CoinDecayService';
import { ResponseHelper } from '../utils/response';
import { AppError, asyncHandler } from '../middleware/error';
import { AuthenticatedRequest } from '../middleware/auth';

export class DecayController {
  /**
   * 获取用户衰减历史
   */
  static getHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const result = await CoinDecayService.getDecayHistory(userId, {
      limit: Number(limit),
      offset,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    ResponseHelper.paginated(
      res,
      result.records,
      Number(page),
      Number(limit),
      result.total,
      'Decay history retrieved successfully'
    );
  });

  /**
   * 获取衰减统计
   */
  static getStatistics = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;
    const { days = 30 } = req.query;

    const statistics = await CoinDecayService.getDecayStatistics(userId, Number(days));
    
    ResponseHelper.success(res, statistics, 'Decay statistics retrieved successfully');
  });

  /**
   * 获取衰减预测
   */
  static getPrediction = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;
    const { days = 7 } = req.query;

    if (Number(days) > 30) {
      throw new AppError('Prediction period cannot exceed 30 days', 400);
    }

    const prediction = await CoinDecayService.predictDecay(userId, Number(days));
    
    ResponseHelper.success(res, prediction, 'Decay prediction retrieved successfully');
  });

  /**
   * 手动触发衰减（管理员功能）
   */
  static triggerDecay = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // 检查管理员权限
    if (req.user!.role !== 'admin') {
      throw new AppError('Admin privileges required', 403);
    }

    const { userId } = req.body;

    await CoinDecayService.triggerDecay(userId);
    
    const message = userId 
      ? `Decay triggered for user ${userId}` 
      : 'Decay triggered for all users';
    
    ResponseHelper.success(res, null, message);
  });

  /**
   * 获取衰减规则列表
   */
  static getRules = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // 只有管理员可以查看衰减规则
    if (req.user!.role !== 'admin') {
      throw new AppError('Admin privileges required', 403);
    }

    const rules = await CoinDecayService.getActiveDecayRules();
    
    ResponseHelper.success(res, rules, 'Decay rules retrieved successfully');
  });

  /**
   * 创建衰减规则（管理员功能）
   */
  static createRule = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // 检查管理员权限
    if (req.user!.role !== 'admin') {
      throw new AppError('Admin privileges required', 403);
    }

    // 这里应该实现创建衰减规则的逻辑
    // 为了简化，先返回未实现的响应
    ResponseHelper.success(res, null, 'Create decay rule feature coming soon');
  });

  /**
   * 更新衰减规则（管理员功能）
   */
  static updateRule = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // 检查管理员权限
    if (req.user!.role !== 'admin') {
      throw new AppError('Admin privileges required', 403);
    }

    // 这里应该实现更新衰减规则的逻辑
    ResponseHelper.success(res, null, 'Update decay rule feature coming soon');
  });

  /**
   * 删除衰减规则（管理员功能）
   */
  static deleteRule = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // 检查管理员权限
    if (req.user!.role !== 'admin') {
      throw new AppError('Admin privileges required', 403);
    }

    // 这里应该实现删除衰减规则的逻辑
    ResponseHelper.success(res, null, 'Delete decay rule feature coming soon');
  });

  /**
   * 获取系统衰减状态
   */
  static getSystemStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // 检查管理员权限
    if (req.user!.role !== 'admin') {
      throw new AppError('Admin privileges required', 403);
    }

    // 获取系统衰减统计信息
    const status = {
      schedulerRunning: true, // 这里应该检查实际的调度器状态
      lastDecayRun: new Date().toISOString(), // 这里应该获取实际的最后运行时间
      totalUsersProcessed: 0, // 这里应该获取实际的统计数据
      totalDecayApplied: 0,
      nextScheduledRun: 'Daily at 02:00 UTC',
    };
    
    ResponseHelper.success(res, status, 'System decay status retrieved successfully');
  });

  /**
   * 获取用户的衰减影响分析
   */
  static getImpactAnalysis = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;
    const { days = 30 } = req.query;

    // 这里应该实现更详细的衰减影响分析
    // 包括：
    // 1. 各学科的衰减情况
    // 2. 衰减趋势分析
    // 3. 建议的复习计划
    // 4. 衰减风险评估
    
    const analysis = {
      totalImpact: 0,
      subjectImpacts: [],
      trendAnalysis: {
        isIncreasing: false,
        weeklyChange: 0,
        monthlyChange: 0,
      },
      riskAssessment: {
        level: 'low' as 'low' | 'medium' | 'high',
        description: 'Your knowledge retention is stable',
        recommendations: [],
      },
      upcomingDecays: [],
    };
    
    ResponseHelper.success(res, analysis, 'Decay impact analysis retrieved successfully');
  });
}