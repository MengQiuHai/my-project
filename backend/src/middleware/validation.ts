import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateRequest = (schema: {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    // 验证请求体
    if (schema.body) {
      const { error } = schema.body.validate(req.body);
      if (error) {
        errors.push(`Body: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // 验证查询参数
    if (schema.query) {
      const { error } = schema.query.validate(req.query);
      if (error) {
        errors.push(`Query: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // 验证路径参数
    if (schema.params) {
      const { error } = schema.params.validate(req.params);
      if (error) {
        errors.push(`Params: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
      return;
    }

    next();
  };
};

// 常用的验证模式
export const commonSchemas = {
  // UUID验证
  uuid: Joi.string().uuid().required(),
  
  // 分页参数
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
  
  // 日期范围
  dateRange: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
  }),
  
  // 用户注册
  userRegistration: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    first_name: Joi.string().max(100),
    last_name: Joi.string().max(100),
  }),
  
  // 用户登录
  userLogin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
  
  // 学习会话创建
  sessionCreation: Joi.object({
    task_id: Joi.string().uuid().required(),
    difficulty_id: Joi.string().uuid().required(),
    session_date: Joi.date().iso().required(),
    focus_time_minutes: Joi.number().integer().min(0).max(1440).required(),
    result_quantity: Joi.number().integer().min(0).required(),
    notes: Joi.string().max(1000),
    metadata: Joi.object(),
  }),
  
  // 任务定义创建
  taskDefinition: Joi.object({
    name: Joi.string().max(100).required(),
    subject: Joi.string().max(50).required(),
    description: Joi.string().max(500),
    base_coin: Joi.number().integer().min(1).required(),
    unit_name: Joi.string().max(30).required(),
    task_type: Joi.string().valid('study', 'practice', 'exam', 'reading', 'coding', 'other').required(),
    validation_rule: Joi.string(),
    metadata: Joi.object(),
  }),
  
  // 奖励创建
  rewardCreation: Joi.object({
    name: Joi.string().max(100).required(),
    description: Joi.string().max(500),
    cost_coins: Joi.number().integer().min(1).required(),
    category: Joi.string().valid('entertainment', 'food', 'shopping', 'activity', 'rest', 'other').required(),
    icon: Joi.string().max(500),
    usage_limit: Joi.number().integer().min(0).default(0),
    cooldown_hours: Joi.number().integer().min(0).default(0),
    metadata: Joi.object(),
  }),
};