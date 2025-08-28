import db from '../config/database';
import { createClient } from 'redis';
import { CoinCalculationEngine } from '../services/CoinCalculationEngine';
import { CoinDecayService } from '../services/CoinDecayService';
import { AchievementService } from '../services/AchievementService';
import { RewardService } from '../services/RewardService';
import { AnalyticsService } from '../services/AnalyticsService';

interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  responseTime?: number;
  details?: any;
}

export class SystemHealthChecker {
  private results: HealthCheckResult[] = [];

  /**
   * Run comprehensive system health check
   */
  async runHealthCheck(): Promise<HealthCheckResult[]> {
    console.log('🏥 Starting system health check...\n');

    await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkCoinSystem(),
      this.checkDecayService(),
      this.checkAchievementSystem(),
      this.checkRewardSystem(),
      this.checkAnalyticsService(),
      this.checkEnvironmentVariables(),
    ]);

    this.printResults();
    return this.results;
  }

  /**
   * Check database connectivity and basic operations
   */
  private async checkDatabase(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test basic connection
      await db.raw('SELECT 1');
      
      // Check if tables exist
      const tables = await db.raw(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      const expectedTables = [
        'users', 'learning_sessions', 'task_definitions', 'difficulties',
        'coin_ledger', 'achievements', 'user_achievements', 'rewards',
        'redemptions', 'coin_decay_rules', 'knex_migrations'
      ];
      
      const existingTables = tables.rows.map((row: any) => row.table_name);
      const missingTables = expectedTables.filter(table => !existingTables.includes(table));
      
      const responseTime = Date.now() - startTime;
      
      if (missingTables.length === 0) {
        this.addResult('Database', 'healthy', 'All tables present and accessible', responseTime);
      } else {
        this.addResult('Database', 'warning', `Missing tables: ${missingTables.join(', ')}`, responseTime, {
          missingTables,
          existingTables
        });
      }
    } catch (error: any) {
      this.addResult('Database', 'error', `Database connection failed: ${error.message}`, Date.now() - startTime);
    }
  }

  /**
   * Check Redis connectivity
   */
  private async checkRedis(): Promise<void> {
    const startTime = Date.now();
    let client: any = null;

    try {
      client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      });
      
      await client.connect();
      
      // Test basic operations
      await client.set('health_check', 'test_value', { EX: 10 });
      const value = await client.get('health_check');
      await client.del('health_check');
      
      const responseTime = Date.now() - startTime;
      
      if (value === 'test_value') {
        this.addResult('Redis', 'healthy', 'Redis is responding correctly', responseTime);
      } else {
        this.addResult('Redis', 'warning', 'Redis operations not working as expected', responseTime);
      }
    } catch (error: any) {
      this.addResult('Redis', 'error', `Redis connection failed: ${error.message}`, Date.now() - startTime);
    } finally {
      if (client?.isOpen) {
        await client.quit();
      }
    }
  }

  /**
   * Check coin calculation system
   */
  private async checkCoinSystem(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test getting a user's coin balance (should handle non-existent user gracefully)
      const balance = await CoinCalculationEngine.getUserCoinBalance('health-check-user');
      
      // Test coin history retrieval
      const history = await CoinCalculationEngine.getCoinHistory('health-check-user', { limit: 1 });
      
      const responseTime = Date.now() - startTime;
      
      this.addResult('Coin System', 'healthy', 'Coin calculation engine working correctly', responseTime, {
        testBalance: balance,
        historyRecords: history.total
      });
    } catch (error: any) {
      this.addResult('Coin System', 'error', `Coin system error: ${error.message}`, Date.now() - startTime);
    }
  }

  /**
   * Check decay service
   */
  private async checkDecayService(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test getting decay statistics
      const stats = await CoinDecayService.getDecayStatistics('health-check-user');
      
      // Test decay prediction
      const predictions = await CoinDecayService.predictDecay('health-check-user', 3);
      
      const responseTime = Date.now() - startTime;
      
      this.addResult('Decay Service', 'healthy', 'Decay service functioning correctly', responseTime, {
        statsGenerated: true,
        predictionsCount: predictions.length
      });
    } catch (error: any) {
      this.addResult('Decay Service', 'error', `Decay service error: ${error.message}`, Date.now() - startTime);
    }
  }

  /**
   * Check achievement system
   */
  private async checkAchievementSystem(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test getting user achievements
      const achievements = await AchievementService.getUserAchievements('health-check-user');
      
      // Test achievement checking (should not fail for non-existent user)
      const newAchievements = await AchievementService.checkAndAwardAchievements('health-check-user');
      
      const responseTime = Date.now() - startTime;
      
      this.addResult('Achievement System', 'healthy', 'Achievement system working correctly', responseTime, {
        achievementsFound: achievements.length,
        newAchievementsChecked: newAchievements.length
      });
    } catch (error: any) {
      this.addResult('Achievement System', 'error', `Achievement system error: ${error.message}`, Date.now() - startTime);
    }
  }

  /**
   * Check reward system
   */
  private async checkRewardSystem(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test getting available rewards
      const rewards = await RewardService.getAvailableRewards('health-check-user');
      
      // Test getting redemption history
      const history = await RewardService.getRedemptionHistory('health-check-user');
      
      const responseTime = Date.now() - startTime;
      
      this.addResult('Reward System', 'healthy', 'Reward system functioning correctly', responseTime, {
        availableRewards: rewards.length,
        historyRecords: history.redemptions.length
      });
    } catch (error: any) {
      this.addResult('Reward System', 'error', `Reward system error: ${error.message}`, Date.now() - startTime);
    }
  }

  /**
   * Check analytics service
   */
  private async checkAnalyticsService(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test getting user analytics
      const analytics = await AnalyticsService.getUserAnalytics('health-check-user', '7d');
      
      // Test comparative analytics
      const comparative = await AnalyticsService.getComparativeAnalytics('health-check-user');
      
      const responseTime = Date.now() - startTime;
      
      this.addResult('Analytics Service', 'healthy', 'Analytics service working correctly', responseTime, {
        analyticsGenerated: true,
        trendsLength: analytics.trends.length,
        userRank: comparative.userRank
      });
    } catch (error: any) {
      this.addResult('Analytics Service', 'error', `Analytics service error: ${error.message}`, Date.now() - startTime);
    }
  }

  /**
   * Check environment variables
   */
  private async checkEnvironmentVariables(): Promise<void> {
    const startTime = Date.now();
    
    const requiredVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'NODE_ENV'
    ];
    
    const optionalVars = [
      'REDIS_URL',
      'PORT'
    ];
    
    const missing = requiredVars.filter(varName => !process.env[varName]);
    const missingOptional = optionalVars.filter(varName => !process.env[varName]);
    
    const responseTime = Date.now() - startTime;
    
    if (missing.length === 0) {
      const message = missingOptional.length > 0 
        ? `All required vars present. Optional vars missing: ${missingOptional.join(', ')}`
        : 'All environment variables configured';
      
      this.addResult('Environment', missingOptional.length > 0 ? 'warning' : 'healthy', message, responseTime, {
        missingRequired: missing,
        missingOptional
      });
    } else {
      this.addResult('Environment', 'error', `Missing required environment variables: ${missing.join(', ')}`, responseTime, {
        missingRequired: missing,
        missingOptional
      });
    }
  }

  /**
   * Add a health check result
   */
  private addResult(component: string, status: 'healthy' | 'warning' | 'error', message: string, responseTime?: number, details?: any): void {
    this.results.push({
      component,
      status,
      message,
      responseTime,
      details
    });
  }

  /**
   * Print formatted health check results
   */
  private printResults(): void {
    console.log('\n📊 Health Check Results:\n');

    const statusEmojis = {
      healthy: '✅',
      warning: '⚠️',
      error: '❌'
    };

    this.results.forEach(result => {
      const emoji = statusEmojis[result.status];
      const responseTime = result.responseTime ? ` (${result.responseTime}ms)` : '';
      
      console.log(`${emoji} ${result.component}${responseTime}`);
      console.log(`   ${result.message}`);
      
      if (result.details && Object.keys(result.details).length > 0) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }
      console.log('');
    });

    // Summary
    const healthy = this.results.filter(r => r.status === 'healthy').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    const errors = this.results.filter(r => r.status === 'error').length;

    console.log('📈 Summary:');
    console.log(`   ✅ Healthy: ${healthy}`);
    console.log(`   ⚠️  Warnings: ${warnings}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   🎯 Overall Status: ${errors > 0 ? 'CRITICAL' : warnings > 0 ? 'WARNING' : 'HEALTHY'}`);
  }

  /**
   * Get overall system health status
   */
  getOverallStatus(): 'healthy' | 'warning' | 'error' {
    if (this.results.some(r => r.status === 'error')) {
      return 'error';
    }
    if (this.results.some(r => r.status === 'warning')) {
      return 'warning';
    }
    return 'healthy';
  }
}

// Export for use in other modules
export default SystemHealthChecker;

// If run directly
if (require.main === module) {
  const healthChecker = new SystemHealthChecker();
  
  healthChecker.runHealthCheck()
    .then((results) => {
      const overallStatus = healthChecker.getOverallStatus();
      process.exit(overallStatus === 'error' ? 1 : 0);
    })
    .catch(error => {
      console.error('Health check failed:', error);
      process.exit(1);
    });
}