import express from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateRequest, commonSchemas } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import Joi from 'joi';

const router = express.Router();

// 用户注册
router.post(
  '/register',
  validateRequest({
    body: commonSchemas.userRegistration,
  }),
  AuthController.register
);

// 用户登录
router.post(
  '/login',
  validateRequest({
    body: commonSchemas.userLogin,
  }),
  AuthController.login
);

// 获取用户资料
router.get('/profile', authenticateToken, AuthController.getProfile);

// 更新用户资料
router.put(
  '/profile',
  authenticateToken,
  validateRequest({
    body: Joi.object({
      first_name: Joi.string().max(100),
      last_name: Joi.string().max(100),
      avatar_url: Joi.string().uri().max(500),
      bio: Joi.string().max(1000),
      preferences: Joi.object(),
    }),
  }),
  AuthController.updateProfile
);

// 修改密码
router.put(
  '/password',
  authenticateToken,
  validateRequest({
    body: Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().min(6).required(),
    }),
  }),
  AuthController.changePassword
);

// 刷新令牌
router.post('/refresh', authenticateToken, AuthController.refreshToken);

// 退出登录
router.post('/logout', authenticateToken, AuthController.logout);

// 删除账户
router.delete(
  '/account',
  authenticateToken,
  validateRequest({
    body: Joi.object({
      password: Joi.string().required(),
    }),
  }),
  AuthController.deleteAccount
);

export default router;