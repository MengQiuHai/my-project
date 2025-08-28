import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // 服务器配置
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'growth_bank',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },
  
  // Redis配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
    expiresIn: process.env.JWT_EXPIRE_TIME || '7d',
  },
  
  // 安全配置
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  },
  
  // 外部API配置
  externalApi: {
    secret: process.env.EXTERNAL_API_SECRET || 'your_external_api_secret',
  },
  
  // 缓存配置
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '3600'),
  },
  
  // 任务队列配置
  queue: {
    redisUrl: process.env.QUEUE_REDIS_URL || 'redis://localhost:6379',
  },
  
  // 上传配置
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
  },
  
  // 日志配置
  log: {
    level: process.env.LOG_LEVEL || 'info',
  },
  
  // 邮件配置（可选）
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
  },
};

export default config;