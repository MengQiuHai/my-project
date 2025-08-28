import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFound } from './middleware/error';
import config from './config';
import RedisClient from './config/redis';

// 导入路由
import authRoutes from './routes/auth';
import sessionRoutes from './routes/sessions';
import taskRoutes from './routes/tasks';
import achievementRoutes from './routes/achievements';
import rewardRoutes from './routes/rewards';
import statsRoutes from './routes/stats';
import coinRoutes from './routes/coins';
import decayRoutes from './routes/decay';
import healthRoutes from './routes/health';

const app = express();

// 安全中间件
app.use(helmet());

// CORS配置
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'http://localhost:3000'
    : '*',
  credentials: true,
}));

// 压缩响应
app.use(compression());

// 请求日志
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined'));
}

// 解析请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
});
app.use(limiter);

// 登录限制（更严格）
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 限制每个IP 15分钟内最多5次登录尝试
  skipSuccessfulRequests: true,
});

// 健康检查端点
app.use('/api/health', healthRoutes);

// 向后兼容的简单健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Growth Bank API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API路由
app.use('/api/auth', loginLimiter, authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/coins', coinRoutes);
app.use('/api/decay', decayRoutes);

// 404处理
app.use(notFound);

// 错误处理
app.use(errorHandler);

// 初始化Redis连接（可选）
const initializeRedis = async (): Promise<void> => {
  try {
    const redis = RedisClient.getInstance();
    await redis.connect();
    if (redis.isAvailable()) {
      console.log('Redis connected successfully');
    } else {
      console.log('Redis not available, continuing without caching');
    }
  } catch (error) {
    console.warn('Redis connection failed, continuing without caching:', error);
    // Don't exit in development if Redis is not available
    if (config.nodeEnv === 'production') {
      console.log('In production, continuing without Redis (caching disabled)');
    }
  }
};

// 优雅关闭处理
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);
  
  try {
    const redis = RedisClient.getInstance();
    if (redis.isAvailable()) {
      await redis.disconnect();
      console.log('Redis disconnected');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// 监听关闭信号
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 未捕获的异常处理
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export { app, initializeRedis };