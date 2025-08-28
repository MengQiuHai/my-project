import { Request, Response } from 'express';
import { ResponseHelper } from '../utils/response';
import db from '../config/database';

export class HealthController {
  /**
   * Quick health check endpoint
   */
  static async quickCheck(req: Request, res: Response): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Test database connection
      await db.raw('SELECT 1 as health');
      
      const responseTime = Date.now() - startTime;
      
      ResponseHelper.success(res, {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        database: 'connected',
        responseTime: `${responseTime}ms`,
        environment: process.env.NODE_ENV || 'development',
        message: 'Growth Bank System is running! 🚀'
      }, 'System is healthy');
    } catch (error: any) {
      ResponseHelper.error(res, `Health check failed: ${error.message}`, 500);
    }
  }

  /**
   * Database status check
   */
  static async databaseCheck(req: Request, res: Response): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Check database tables
      const tables = await db.raw(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      const responseTime = Date.now() - startTime;
      
      ResponseHelper.success(res, {
        status: 'connected',
        responseTime: `${responseTime}ms`,
        tablesCount: tables.rows.length,
        tables: tables.rows.map((row: any) => row.table_name)
      }, 'Database is accessible');
    } catch (error: any) {
      ResponseHelper.error(res, `Database check failed: ${error.message}`, 500);
    }
  }

  /**
   * System info endpoint
   */
  static async systemInfo(req: Request, res: Response): Promise<void> {
    try {
      const systemInfo = {
        system: 'Growth Bank System',
        version: '1.0.0',
        description: 'Gamified Learning Management Platform',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        platform: process.platform,
        uptime: `${Math.floor(process.uptime())} seconds`,
        features: [
          'User Authentication',
          'Learning Session Tracking',
          'Coin Calculation Engine',
          'Knowledge Decay Simulation',
          'Achievement System',
          'Reward Marketplace',
          'Analytics Dashboard'
        ],
        endpoints: {
          health: '/api/health',
          auth: '/api/auth/*',
          sessions: '/api/sessions/*',
          coins: '/api/coins/*',
          achievements: '/api/achievements/*',
          rewards: '/api/rewards/*',
          analytics: '/api/stats/*'
        }
      };

      ResponseHelper.success(res, systemInfo, 'System information retrieved');
    } catch (error: any) {
      ResponseHelper.error(res, `System info failed: ${error.message}`, 500);
    }
  }

  /**
   * Quick test data endpoint (for development)
   */
  static async testData(req: Request, res: Response): Promise<void> {
    try {
      const testData = {
        timestamp: new Date().toISOString(),
        sampleUser: {
          username: 'demo_user',
          email: 'demo@example.com',
          status: 'active'
        },
        sampleSession: {
          subject: 'Mathematics',
          difficulty: 'Medium',
          focusTime: 60,
          coinsEarned: 45
        },
        sampleAchievement: {
          name: 'First Steps',
          description: 'Complete your first learning session',
          points: 50
        },
        apiExamples: {
          register: 'POST /api/auth/register',
          login: 'POST /api/auth/login',
          createSession: 'POST /api/sessions',
          getBalance: 'GET /api/coins/balance'
        }
      };

      ResponseHelper.success(res, testData, 'Test data generated');
    } catch (error: any) {
      ResponseHelper.error(res, `Test data generation failed: ${error.message}`, 500);
    }
  }
}