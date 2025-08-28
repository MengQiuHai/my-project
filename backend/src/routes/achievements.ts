import express from 'express';
import { AchievementController } from '../controllers/AchievementController';
import { validateRequest, commonSchemas } from '../middleware/validation';
import { authenticateToken, requireRole } from '../middleware/auth';
import Joi from 'joi';

const router = express.Router();

// All achievement routes require authentication
router.use(authenticateToken);

// Get user's achievements
router.get('/my-achievements', AchievementController.getUserAchievements);

// Get achievement progress
router.get('/progress', AchievementController.getProgress);

// Check for new achievements
router.post('/check', AchievementController.checkAchievements);

// Get achievement summary
router.get('/summary', AchievementController.getSummary);

// Get all available achievements
router.get(
  '/',
  validateRequest({
    query: Joi.object({
      category: Joi.string().max(50),
      rarity: Joi.string().valid('common', 'rare', 'epic', 'legendary'),
    }),
  }),
  AchievementController.getAllAchievements
);

// Get achievement categories
router.get('/categories', AchievementController.getCategories);

// Get achievement leaderboard
router.get(
  '/leaderboard',
  validateRequest({
    query: Joi.object({
      limit: Joi.number().integer().min(1).max(100).default(10),
      type: Joi.string().valid('points', 'count').default('points'),
    }),
  }),
  AchievementController.getLeaderboard
);

// Get specific achievement details
router.get(
  '/:achievementId',
  validateRequest({
    params: Joi.object({
      achievementId: commonSchemas.uuid,
    }),
  }),
  AchievementController.getById
);

// Admin routes
// Get all achievements for admin
router.get(
  '/admin/all',
  requireRole(['admin']),
  validateRequest({
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      category: Joi.string().max(50),
      rarity: Joi.string().valid('common', 'rare', 'epic', 'legendary'),
      isActive: Joi.boolean(),
    }),
  }),
  AchievementController.adminGetAll
);

// Create achievement (Admin)
router.post(
  '/admin',
  requireRole(['admin']),
  validateRequest({
    body: Joi.object({
      name: Joi.string().max(100).required(),
      description: Joi.string().max(500).required(),
      condition_expression: Joi.string().required(),
      icon: Joi.string().max(500),
      category: Joi.string().max(50).default('general'),
      rarity: Joi.string().valid('common', 'rare', 'epic', 'legendary').default('common'),
      points: Joi.number().integer().min(0).default(0),
      is_active: Joi.boolean().default(true),
      metadata: Joi.object(),
    }),
  }),
  AchievementController.createAchievement
);

// Update achievement (Admin)
router.put(
  '/admin/:achievementId',
  requireRole(['admin']),
  validateRequest({
    params: Joi.object({
      achievementId: commonSchemas.uuid,
    }),
    body: Joi.object({
      name: Joi.string().max(100),
      description: Joi.string().max(500),
      condition_expression: Joi.string(),
      icon: Joi.string().max(500),
      category: Joi.string().max(50),
      rarity: Joi.string().valid('common', 'rare', 'epic', 'legendary'),
      points: Joi.number().integer().min(0),
      is_active: Joi.boolean(),
      metadata: Joi.object(),
    }),
  }),
  AchievementController.updateAchievement
);

// Delete achievement (Admin)
router.delete(
  '/admin/:achievementId',
  requireRole(['admin']),
  validateRequest({
    params: Joi.object({
      achievementId: commonSchemas.uuid,
    }),
  }),
  AchievementController.deleteAchievement
);

// Get achievement statistics (Admin)
router.get('/admin/statistics', requireRole(['admin']), AchievementController.getStatistics);

// Batch check achievements (Admin)
router.post('/admin/batch-check', requireRole(['admin']), AchievementController.batchCheck);

export default router;