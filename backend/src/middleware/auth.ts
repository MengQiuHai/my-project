import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { UserModel } from '../models/User';

export interface AuthenticatedRequest extends Request {
  user?: {
    user_id: string;
    username: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as any;
    
    // 验证用户是否仍然存在且状态正常
    const user = await UserModel.findById(decoded.user_id);
    if (!user || user.status !== 'active') {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
      return;
    }

    req.user = {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      const user = await UserModel.findById(decoded.user_id);
      
      if (user && user.status === 'active') {
        req.user = {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          role: user.role,
        };
      }
    }

    next();
  } catch (error) {
    // 可选认证失败时不返回错误，直接继续
    next();
  }
};