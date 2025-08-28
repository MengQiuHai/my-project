import express from 'express';
import { CoinController } from '../controllers/CoinController';
import { validateRequest } from '../middleware/validation';
import { authenticateToken, requireRole } from '../middleware/auth';
import Joi from 'joi';

const router = express.Router();

// 所有金币路由都需要认证
router.use(authenticateToken);

// 获取金币摘要
router.get(
  '/summary',
  validateRequest({
    query: Joi.object({
      days: Joi.number().integer().min(1).max(365).default(30),
    }),
  }),
  CoinController.getSummary
);

// 获取当前余额
router.get('/balance', CoinController.getBalance);

// 获取金币历史
router.get(
  '/history',
  validateRequest({
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      startDate: Joi.date().iso(),
      endDate: Joi.date().iso().min(Joi.ref('startDate')),
      changeType: Joi.string().valid('earned', 'decayed', 'redeemed', 'bonus', 'penalty'),
    }),
  }),
  CoinController.getHistory
);

// 获取效率统计
router.get(
  '/efficiency',
  validateRequest({
    query: Joi.object({
      days: Joi.number().integer().min(1).max(90).default(7),
    }),
  }),
  CoinController.getEfficiency
);

// 获取用户排名
router.get('/ranking', CoinController.getRanking);

// 获取排行榜
router.get(
  '/leaderboard',
  validateRequest({
    query: Joi.object({
      limit: Joi.number().integer().min(1).max(100).default(10),
    }),
  }),
  CoinController.getLeaderboard
);

// 预览金币计算
router.post(
  '/preview',
  validateRequest({
    body: Joi.object({
      taskId: Joi.string().uuid().required(),
      difficultyId: Joi.string().uuid().required(),
      focusTimeMinutes: Joi.number().integer().min(0).max(1440).required(),
      resultQuantity: Joi.number().integer().min(0).required(),
      sessionDate: Joi.date().iso(),
    }),
  }),
  CoinController.previewCalculation
);

// 批量计算金币
router.post(
  '/batch-calculate',
  validateRequest({
    body: Joi.object({
      sessions: Joi.array()
        .items(
          Joi.object({
            taskId: Joi.string().uuid().required(),
            difficultyId: Joi.string().uuid().required(),
            focusTimeMinutes: Joi.number().integer().min(0).max(1440).required(),
            resultQuantity: Joi.number().integer().min(0).required(),
            sessionDate: Joi.date().iso().required(),
          })
        )
        .min(1)
        .max(50)
        .required(),
    }),
  }),
  CoinController.batchCalculate
);

// 获取图表数据
router.get(
  '/chart',
  validateRequest({
    query: Joi.object({
      period: Joi.string().valid('7d', '30d', '90d').default('7d'),
      type: Joi.string().valid('daily', 'weekly', 'monthly').default('daily'),
    }),
  }),
  CoinController.getChartData
);

// 管理员功能 - 调整金币
router.post(
  '/adjust',
  requireRole(['admin']),
  validateRequest({
    body: Joi.object({
      userId: Joi.string().uuid().required(),
      amount: Joi.number().integer().required(),
      reason: Joi.string().max(500).required(),
    }),
  }),
  CoinController.adjustCoins
);

export default router;