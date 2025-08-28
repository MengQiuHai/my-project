import { app, initializeRedis } from './app';
import config from './config';
import db from './config/database';
import { CoinDecayService } from './services/CoinDecayService';

const startServer = async (): Promise<void> => {
  try {
    // 测试数据库连接
    console.log('Connecting to database...');
    await db.raw('SELECT 1');
    console.log('✅ Database connected successfully');

    // 初始化Redis（可选）
    console.log('Initializing Redis...');
    await initializeRedis();

    // 启动金币衰减调度器
    console.log('Starting coin decay scheduler...');
    try {
      CoinDecayService.startScheduler();
      console.log('✅ Coin decay scheduler started');
    } catch (error) {
      console.warn('⚠️  Coin decay scheduler failed to start:', error);
    }

    // 启动服务器
    const server = app.listen(config.port, () => {
      console.log(`
🚀 Growth Bank API Server is running!
📝 Environment: ${config.nodeEnv}
🌐 Port: ${config.port}
🔗 URL: http://localhost:${config.port}
📊 Database: Connected
🔴 Redis: ${process.env.REDIS_URL ? 'Configured' : 'Not configured (optional)'}
⏰ Started at: ${new Date().toISOString()}

🔍 Health Check: http://localhost:${config.port}/api/health
📚 API Docs: http://localhost:${config.port}/api/health/info
      `);
    });

    // 设置服务器超时
    server.timeout = 30000; // 30秒

    // 优雅关闭处理
    const gracefulShutdown = (signal: string) => {
      console.log(`\nReceived ${signal}, shutting down gracefully...`);
      
      server.close(async (err) => {
        if (err) {
          console.error('Error closing server:', err);
          process.exit(1);
        }
        
        try {
          // 停止衰减调度器
          CoinDecayService.stopScheduler();
          
          // 关闭数据库连接
          await db.destroy();
          console.log('Database disconnected');
          
          console.log('Server shutdown complete');
          process.exit(0);
        } catch (error) {
          console.error('Error during shutdown:', error);
          process.exit(1);
        }
      });
      
      // 强制关闭超时
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error: any) {
    console.error('❌ Failed to start server:');
    console.error('Error details:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Troubleshooting tips:');
      console.error('1. Make sure PostgreSQL is running');
      console.error('2. Check your database connection settings in .env file');
      console.error('3. Verify database credentials and permissions');
      console.error('4. Run: npm run migrate (if database exists)');
    }
    
    process.exit(1);
  }
};

// 启动服务器
startServer();