import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { generateToken } from '../utils/jwt';
import { ResponseHelper } from '../utils/response';
import { AppError, asyncHandler } from '../middleware/error';
import { AuthenticatedRequest } from '../middleware/auth';

export class AuthController {
  static register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { username, email, password, first_name, last_name } = req.body;

    // 检查用户是否已存在
    const existingUserByEmail = await UserModel.findByEmail(email);
    if (existingUserByEmail) {
      throw new AppError('Email already registered', 409);
    }

    const existingUserByUsername = await UserModel.findByUsername(username);
    if (existingUserByUsername) {
      throw new AppError('Username already taken', 409);
    }

    // 创建新用户
    const user = await UserModel.create({
      username,
      email,
      password,
      first_name,
      last_name,
    });

    // 生成JWT令牌
    const token = generateToken({
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    // 返回用户信息（不包含密码）
    const { password_hash, ...userWithoutPassword } = user;

    ResponseHelper.created(res, {
      user: userWithoutPassword,
      token,
    }, 'User registered successfully');
  });

  static login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    // 查找用户
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // 检查用户状态
    if (user.status !== 'active') {
      throw new AppError('Account is not active', 401);
    }

    // 验证密码
    const isPasswordValid = await UserModel.verifyPassword(user, password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // 更新最后登录时间
    await UserModel.updateLastLogin(user.user_id);

    // 生成JWT令牌
    const token = generateToken({
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    // 返回用户信息（不包含密码）
    const { password_hash, ...userWithoutPassword } = user;

    ResponseHelper.success(res, {
      user: userWithoutPassword,
      token,
    }, 'Login successful');
  });

  static getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // 获取用户统计信息
    const stats = await UserModel.getUserStats(userId);

    // 返回用户信息（不包含密码）
    const { password_hash, ...userWithoutPassword } = user;

    ResponseHelper.success(res, {
      user: userWithoutPassword,
      stats,
    });
  });

  static updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;
    const { first_name, last_name, avatar_url, bio, preferences } = req.body;

    const updatedUser = await UserModel.update(userId, {
      first_name,
      last_name,
      avatar_url,
      bio,
      preferences,
    });

    if (!updatedUser) {
      throw new AppError('User not found', 404);
    }

    // 返回用户信息（不包含密码）
    const { password_hash, ...userWithoutPassword } = updatedUser;

    ResponseHelper.success(res, {
      user: userWithoutPassword,
    }, 'Profile updated successfully');
  });

  static changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;
    const { currentPassword, newPassword } = req.body;

    // 获取用户信息
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // 验证当前密码
    const isCurrentPasswordValid = await UserModel.verifyPassword(user, currentPassword);
    if (!isCurrentPasswordValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    // 更新密码
    const success = await UserModel.updatePassword(userId, newPassword);
    if (!success) {
      throw new AppError('Failed to update password', 500);
    }

    ResponseHelper.success(res, null, 'Password changed successfully');
  });

  static logout = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // 在实际应用中，可能需要将令牌添加到黑名单
    // 这里只是简单地返回成功响应
    ResponseHelper.success(res, null, 'Logout successful');
  });

  static deleteAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;
    const { password } = req.body;

    // 获取用户信息
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // 验证密码
    const isPasswordValid = await UserModel.verifyPassword(user, password);
    if (!isPasswordValid) {
      throw new AppError('Password is incorrect', 400);
    }

    // 删除用户（级联删除相关数据）
    const success = await UserModel.delete(userId);
    if (!success) {
      throw new AppError('Failed to delete account', 500);
    }

    ResponseHelper.success(res, null, 'Account deleted successfully');
  });

  static refreshToken = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.user_id;

    // 获取最新的用户信息
    const user = await UserModel.findById(userId);
    if (!user || user.status !== 'active') {
      throw new AppError('User not found or inactive', 401);
    }

    // 生成新的JWT令牌
    const token = generateToken({
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    ResponseHelper.success(res, { token }, 'Token refreshed successfully');
  });
}