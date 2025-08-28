import { Request, Response } from 'express';
import { LearningSessionModel } from '../models/LearningSession';
import { ResponseHelper } from '../utils/response';
import { AppError, asyncHandler } from '../middleware/error';
import { AuthenticatedRequest } from '../middleware/auth';

export class SessionController {
  static create = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;
    const {
      task_id,
      difficulty_id,
      session_date,
      focus_time_minutes,
      result_quantity,
      notes,
      metadata,
    } = req.body;

    try {
      const session = await LearningSessionModel.create({
        user_id: userId,
        task_id,
        difficulty_id,
        session_date,
        focus_time_minutes,
        result_quantity,
        notes,
        metadata,
      });

      ResponseHelper.created(res, session, 'Learning session created successfully');
    } catch (error: any) {
      if (error.message.includes('not found')) {
        throw new AppError('Invalid task or difficulty ID', 400);
      }
      throw error;
    }
  });

  static getById = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { sessionId } = req.params;
    const userId = req.user!.user_id;

    const session = await LearningSessionModel.findById(sessionId);
    if (!session) {
      throw new AppError('Session not found', 404);
    }

    // 确保用户只能访问自己的会话
    if (session.user_id !== userId) {
      throw new AppError('Access denied', 403);
    }

    ResponseHelper.success(res, session);
  });

  static getList = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      taskId,
      subject,
      status,
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const result = await LearningSessionModel.findByUserId(userId, {
      limit: Number(limit),
      offset,
      startDate: startDate as string,
      endDate: endDate as string,
      taskId: taskId as string,
      subject: subject as string,
      status: status as string,
    });

    ResponseHelper.paginated(
      res,
      result.sessions,
      Number(page),
      Number(limit),
      result.total,
      'Sessions retrieved successfully'
    );
  });

  static update = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { sessionId } = req.params;
    const userId = req.user!.user_id;

    // 先检查会话是否存在且属于当前用户
    const existingSession = await LearningSessionModel.findById(sessionId);
    if (!existingSession) {
      throw new AppError('Session not found', 404);
    }

    if (existingSession.user_id !== userId) {
      throw new AppError('Access denied', 403);
    }

    const {
      task_id,
      difficulty_id,
      session_date,
      focus_time_minutes,
      result_quantity,
      notes,
      metadata,
    } = req.body;

    try {
      const updatedSession = await LearningSessionModel.update(sessionId, {
        task_id,
        difficulty_id,
        session_date,
        focus_time_minutes,
        result_quantity,
        notes,
        metadata,
      });

      if (!updatedSession) {
        throw new AppError('Failed to update session', 500);
      }

      ResponseHelper.success(res, updatedSession, 'Session updated successfully');
    } catch (error: any) {
      if (error.message.includes('not found')) {
        throw new AppError('Invalid task or difficulty ID', 400);
      }
      throw error;
    }
  });

  static delete = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { sessionId } = req.params;
    const userId = req.user!.user_id;

    // 先检查会话是否存在且属于当前用户
    const existingSession = await LearningSessionModel.findById(sessionId);
    if (!existingSession) {
      throw new AppError('Session not found', 404);
    }

    if (existingSession.user_id !== userId) {
      throw new AppError('Access denied', 403);
    }

    const success = await LearningSessionModel.delete(sessionId);
    if (!success) {
      throw new AppError('Failed to delete session', 500);
    }

    ResponseHelper.success(res, null, 'Session deleted successfully');
  });

  static getStats = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;
    const { startDate, endDate, subject } = req.query;

    const stats = await LearningSessionModel.getStatsByUser(userId, {
      startDate: startDate as string,
      endDate: endDate as string,
      subject: subject as string,
    });

    ResponseHelper.success(res, stats, 'Statistics retrieved successfully');
  });

  static getTodaySession = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;
    const today = new Date().toISOString().split('T')[0];

    const result = await LearningSessionModel.findByUserId(userId, {
      startDate: today,
      endDate: today,
      limit: 100,
    });

    ResponseHelper.success(res, result.sessions, 'Today\'s sessions retrieved successfully');
  });

  static getWeeklyStats = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    const startDate = weekAgo.toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];

    const stats = await LearningSessionModel.getStatsByUser(userId, {
      startDate,
      endDate,
    });

    ResponseHelper.success(res, stats, 'Weekly statistics retrieved successfully');
  });

  static getMonthlyStats = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const startDate = monthAgo.toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];

    const stats = await LearningSessionModel.getStatsByUser(userId, {
      startDate,
      endDate,
    });

    ResponseHelper.success(res, stats, 'Monthly statistics retrieved successfully');
  });
}