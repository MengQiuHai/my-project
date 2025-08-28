import express from 'express';
import { RewardController } from '../controllers/RewardController';
import { validateRequest, commonSchemas } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import Joi from 'joi';

const router = express.Router();

// All reward routes require authentication
router.use(authenticateToken);

// Get reward shop summary
router.get('/shop/summary', RewardController.getShopSummary);

// Get user's rewards
router.get(
  '/',
  validateRequest({
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      category: Joi.string().valid('entertainment', 'food', 'shopping', 'activity', 'rest', 'other'),
      isActive: Joi.boolean(),
    }),
  }),
  RewardController.getUserRewards
);

// Create new reward
router.post(
  '/',
  validateRequest({
    body: commonSchemas.rewardCreation,
  }),
  RewardController.createReward
);

// Create default rewards
router.post('/setup-defaults', RewardController.createDefaultRewards);

// Get reward categories
router.get('/categories', RewardController.getCategories);

// Get reward recommendations
router.get(
  '/recommendations',
  validateRequest({
    query: Joi.object({
      limit: Joi.number().integer().min(1).max(20).default(5),
    }),
  }),
  RewardController.getRecommendations
);

// Get redemption history
router.get(
  '/redemptions',
  validateRequest({
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      startDate: Joi.date().iso(),
      endDate: Joi.date().iso().min(Joi.ref('startDate')),
      status: Joi.string().valid('pending', 'completed', 'cancelled'),
    }),
  }),
  RewardController.getRedemptionHistory
);

// Get redemption statistics
router.get(
  '/statistics',
  validateRequest({
    query: Joi.object({
      days: Joi.number().integer().min(1).max(365).default(30),
    }),
  }),
  RewardController.getStatistics
);

// Bulk update rewards status
router.patch(
  '/bulk-status',
  validateRequest({
    body: Joi.object({
      rewardIds: Joi.array().items(Joi.string().uuid()).min(1).max(50).required(),
      isActive: Joi.boolean().required(),
    }),
  }),
  RewardController.bulkUpdateStatus
);

// Get specific reward
router.get(
  '/:rewardId',
  validateRequest({
    params: Joi.object({
      rewardId: commonSchemas.uuid,
    }),
  }),
  RewardController.getById
);

// Update reward
router.put(
  '/:rewardId',
  validateRequest({
    params: Joi.object({
      rewardId: commonSchemas.uuid,
    }),
    body: Joi.object({
      name: Joi.string().max(100),
      description: Joi.string().max(500),
      cost_coins: Joi.number().integer().min(1),
      category: Joi.string().valid('entertainment', 'food', 'shopping', 'activity', 'rest', 'other'),
      icon: Joi.string().max(500),
      usage_limit: Joi.number().integer().min(0),
      cooldown_hours: Joi.number().integer().min(0),
      is_active: Joi.boolean(),
      metadata: Joi.object(),
    }),
  }),
  RewardController.updateReward
);

// Delete reward
router.delete(
  '/:rewardId',
  validateRequest({
    params: Joi.object({
      rewardId: commonSchemas.uuid,
    }),
  }),
  RewardController.deleteReward
);

// Check if reward can be redeemed
router.get(
  '/:rewardId/can-redeem',
  validateRequest({
    params: Joi.object({
      rewardId: commonSchemas.uuid,
    }),
  }),
  RewardController.canRedeem
);

// Redeem reward
router.post(
  '/:rewardId/redeem',
  validateRequest({
    params: Joi.object({
      rewardId: commonSchemas.uuid,
    }),
    body: Joi.object({
      notes: Joi.string().max(500),
    }),
  }),
  RewardController.redeemReward
);

export default router;