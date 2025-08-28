import express from 'express';
import { SessionController } from '../controllers/SessionController';
import { validateRequest, commonSchemas } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import Joi from 'joi';

const router = express.Router();

// 所有会话路由都需要认证
router.use(authenticateToken);

// 创建学习会话
router.post(
  '/',
  validateRequest({
    body: commonSchemas.sessionCreation,
  }),
  SessionController.create
);

// 获取会话列表
router.get(
  '/',
  validateRequest({
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      startDate: Joi.date().iso(),
      endDate: Joi.date().iso().min(Joi.ref('startDate')),
      taskId: Joi.string().uuid(),
      subject: Joi.string().max(50),
      status: Joi.string().valid('completed', 'partial', 'cancelled'),
    }),
  }),
  SessionController.getList
);

// 获取今日会话
router.get('/today', SessionController.getTodaySession);

// 获取会话统计
router.get(
  '/stats',
  validateRequest({
    query: Joi.object({
      startDate: Joi.date().iso(),
      endDate: Joi.date().iso().min(Joi.ref('startDate')),
      subject: Joi.string().max(50),
    }),
  }),
  SessionController.getStats
);

// 获取周统计
router.get('/stats/weekly', SessionController.getWeeklyStats);

// 获取月统计
router.get('/stats/monthly', SessionController.getMonthlyStats);

// 获取单个会话
router.get(
  '/:sessionId',
  validateRequest({
    params: Joi.object({
      sessionId: commonSchemas.uuid,
    }),
  }),
  SessionController.getById
);

// 更新会话
router.put(
  '/:sessionId',
  validateRequest({
    params: Joi.object({
      sessionId: commonSchemas.uuid,
    }),
    body: Joi.object({
      task_id: Joi.string().uuid(),
      difficulty_id: Joi.string().uuid(),
      session_date: Joi.date().iso(),
      focus_time_minutes: Joi.number().integer().min(0).max(1440),
      result_quantity: Joi.number().integer().min(0),
      notes: Joi.string().max(1000),
      metadata: Joi.object(),
    }),
  }),
  SessionController.update
);

// 删除会话
router.delete(
  '/:sessionId',
  validateRequest({
    params: Joi.object({
      sessionId: commonSchemas.uuid,
    }),
  }),
  SessionController.delete
);

export default router;