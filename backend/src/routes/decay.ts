import express from 'express';
import { DecayController } from '../controllers/DecayController';
import { validateRequest } from '../middleware/validation';
import { authenticateToken, requireRole } from '../middleware/auth';
import Joi from 'joi';

const router = express.Router();

// 所有衰减路由都需要认证
router.use(authenticateToken);

// 获取衰减历史
router.get(
  '/history',
  validateRequest({
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      startDate: Joi.date().iso(),
      endDate: Joi.date().iso().min(Joi.ref('startDate')),
    }),
  }),
  DecayController.getHistory
);

// 获取衰减统计
router.get(
  '/statistics',
  validateRequest({
    query: Joi.object({
      days: Joi.number().integer().min(1).max(365).default(30),
    }),
  }),
  DecayController.getStatistics
);

// 获取衰减预测
router.get(
  '/prediction',
  validateRequest({
    query: Joi.object({
      days: Joi.number().integer().min(1).max(30).default(7),
    }),
  }),
  DecayController.getPrediction
);

// 获取衰减影响分析
router.get(
  '/impact-analysis',
  validateRequest({
    query: Joi.object({
      days: Joi.number().integer().min(1).max(90).default(30),
    }),
  }),
  DecayController.getImpactAnalysis
);

// 管理员功能
// 获取衰减规则
router.get('/rules', requireRole(['admin']), DecayController.getRules);

// 创建衰减规则
router.post(
  '/rules',
  requireRole(['admin']),
  validateRequest({
    body: Joi.object({
      name: Joi.string().max(100).required(),
      description: Joi.string().max(500),
      threshold_days: Joi.number().integer().min(1).required(),
      decay_rate: Joi.number().min(0).max(1).required(),
      decay_type: Joi.string().valid('percentage', 'fixed').required(),
      applies_to: Joi.string().valid('all', 'subject', 'task_type').required(),
      scope_value: Joi.string().max(50),
      priority: Joi.number().integer().min(0).default(0),
      metadata: Joi.object(),
    }),
  }),
  DecayController.createRule
);

// 更新衰减规则
router.put(
  '/rules/:ruleId',
  requireRole(['admin']),
  validateRequest({
    params: Joi.object({
      ruleId: Joi.string().uuid().required(),
    }),
    body: Joi.object({
      name: Joi.string().max(100),
      description: Joi.string().max(500),
      threshold_days: Joi.number().integer().min(1),
      decay_rate: Joi.number().min(0).max(1),
      decay_type: Joi.string().valid('percentage', 'fixed'),
      applies_to: Joi.string().valid('all', 'subject', 'task_type'),
      scope_value: Joi.string().max(50),
      priority: Joi.number().integer().min(0),
      is_active: Joi.boolean(),
      metadata: Joi.object(),
    }),
  }),
  DecayController.updateRule
);

// 删除衰减规则
router.delete(
  '/rules/:ruleId',
  requireRole(['admin']),
  validateRequest({
    params: Joi.object({
      ruleId: Joi.string().uuid().required(),
    }),
  }),
  DecayController.deleteRule
);

// 手动触发衰减
router.post(
  '/trigger',
  requireRole(['admin']),
  validateRequest({
    body: Joi.object({
      userId: Joi.string().uuid(), // 可选，如果不提供则处理所有用户
    }),
  }),
  DecayController.triggerDecay
);

// 获取系统衰减状态
router.get('/system-status', requireRole(['admin']), DecayController.getSystemStatus);

export default router;