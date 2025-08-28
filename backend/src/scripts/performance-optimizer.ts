import db from '../src/config/database';
import { createClient } from 'redis';

export class PerformanceOptimizer {
  private redisClient: any;

  constructor() {
    this.redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
  }

  /**
   * Analyze database performance and suggest optimizations
   */
  async analyzeDatabasePerformance(): Promise<void> {
    console.log('🔍 Analyzing database performance...');

    try {
      // Check for missing indexes
      await this.checkMissingIndexes();
      
      // Analyze slow queries
      await this.analyzeSlowQueries();
      
      // Check table sizes
      await this.checkTableSizes();
      
      // Verify foreign key constraints
      await this.verifyConstraints();
      
      console.log('✅ Database performance analysis completed');
    } catch (error) {
      console.error('❌ Database analysis failed:', error);
    }
  }

  /**
   * Check for missing indexes that could improve performance
   */
  private async checkMissingIndexes(): Promise<void> {
    console.log('\n📊 Checking for missing indexes...');

    const indexChecks = [
      {
        table: 'learning_sessions',
        columns: ['user_id', 'session_date'],
        reason: 'Frequently queried together for analytics',
      },
      {
        table: 'coin_ledger',
        columns: ['user_id', 'created_at'],
        reason: 'Coin history queries with date filtering',
      },
      {
        table: 'user_achievements',
        columns: ['user_id', 'earned_at'],
        reason: 'Achievement timeline queries',
      },
      {
        table: 'redemptions',
        columns: ['user_id', 'redeemed_at'],
        reason: 'Redemption history with date sorting',
      },
    ];

    for (const check of indexChecks) {
      try {
        const result = await db.raw(`
          SELECT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = ? AND indexname LIKE ?
          ) as index_exists
        `, [check.table, `%${check.columns.join('_')}%`]);

        if (!result.rows[0].index_exists) {
          console.log(`⚠️  Missing index on ${check.table}(${check.columns.join(', ')})`);
          console.log(`   Reason: ${check.reason}`);
          console.log(`   Suggested: CREATE INDEX idx_${check.table}_${check.columns.join('_')} ON ${check.table}(${check.columns.join(', ')});`);
        } else {
          console.log(`✅ Index exists on ${check.table}(${check.columns.join(', ')})`);
        }
      } catch (error) {
        console.log(`❌ Could not check index for ${check.table}: ${error}`);
      }
    }
  }

  /**
   * Analyze potentially slow queries
   */
  private async analyzeSlowQueries(): Promise<void> {
    console.log('\n🐌 Analyzing potentially slow queries...');

    // Test common query patterns and measure execution time
    const queries = [
      {
        name: 'User sessions with analytics',
        query: () => db('learning_sessions')
          .leftJoin('task_definitions', 'learning_sessions.task_id', 'task_definitions.task_id')
          .where('learning_sessions.user_id', 'test-user-id')
          .where('learning_sessions.created_at', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
          .select('*')
          .limit(100),
      },
      {
        name: 'Coin transaction history',
        query: () => db('coin_ledger')
          .where('user_id', 'test-user-id')
          .orderBy('created_at', 'desc')
          .limit(50),
      },
      {
        name: 'User achievements with details',
        query: () => db('user_achievements')
          .leftJoin('achievements', 'user_achievements.achievement_id', 'achievements.achievement_id')
          .where('user_achievements.user_id', 'test-user-id')
          .select('*'),
      },
      {
        name: 'Learning trends aggregation',
        query: () => db('learning_sessions')
          .where('user_id', 'test-user-id')
          .where('session_date', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .select(
            'session_date',
            db.raw('COUNT(*) as sessions'),
            db.raw('SUM(focus_time_minutes) as total_focus'),
            db.raw('SUM(total_coins) as total_coins')
          )
          .groupBy('session_date')
          .orderBy('session_date'),
      },
    ];

    for (const queryTest of queries) {
      try {
        const startTime = Date.now();
        await queryTest.query();
        const endTime = Date.now();
        const executionTime = endTime - startTime;

        if (executionTime > 100) {
          console.log(`⚠️  Slow query detected: ${queryTest.name} (${executionTime}ms)`);
        } else {
          console.log(`✅ ${queryTest.name}: ${executionTime}ms`);
        }
      } catch (error) {
        console.log(`❌ Query failed: ${queryTest.name} - ${error}`);
      }
    }
  }

  /**
   * Check table sizes to identify potential optimization targets
   */
  private async checkTableSizes(): Promise<void> {
    console.log('\n📈 Checking table sizes...');

    try {
      const result = await db.raw(`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE schemaname = 'public'
        ORDER BY tablename, attname
      `);

      const tables = ['users', 'learning_sessions', 'coin_ledger', 'achievements', 'user_achievements'];
      
      for (const table of tables) {
        const tableStats = result.rows.filter((row: any) => row.tablename === table);
        if (tableStats.length > 0) {
          console.log(`📋 ${table}:`);
          tableStats.forEach((stat: any) => {
            if (stat.n_distinct !== null) {
              console.log(`   ${stat.attname}: ${stat.n_distinct} distinct values`);
            }
          });
        }
      }
    } catch (error) {
      console.log(`❌ Could not analyze table sizes: ${error}`);
    }
  }

  /**
   * Verify foreign key constraints are properly set up
   */
  private async verifyConstraints(): Promise<void> {
    console.log('\n🔗 Verifying foreign key constraints...');

    try {
      const result = await db.raw(`
        SELECT
          tc.table_name,
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
        ORDER BY tc.table_name, tc.constraint_name
      `);

      const expectedConstraints = [
        'learning_sessions -> users',
        'learning_sessions -> task_definitions',
        'learning_sessions -> difficulties',
        'coin_ledger -> users',
        'user_achievements -> users',
        'user_achievements -> achievements',
        'redemptions -> users',
        'redemptions -> rewards',
      ];

      console.log('Existing foreign key constraints:');
      result.rows.forEach((row: any) => {
        console.log(`✅ ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`);
      });

      if (result.rows.length < expectedConstraints.length) {
        console.log('⚠️  Some expected constraints might be missing');
      }
    } catch (error) {
      console.log(`❌ Could not verify constraints: ${error}`);
    }
  }

  /**
   * Set up Redis caching for frequently accessed data
   */
  async setupCaching(): Promise<void> {
    console.log('\n💾 Setting up Redis caching...');

    try {
      await this.redisClient.connect();
      console.log('✅ Connected to Redis');

      // Test cache functionality
      await this.redisClient.setEx('test_key', 60, 'test_value');
      const testValue = await this.redisClient.get('test_key');
      
      if (testValue === 'test_value') {
        console.log('✅ Redis caching is working correctly');
      } else {
        console.log('❌ Redis caching test failed');
      }

      await this.redisClient.del('test_key');
    } catch (error) {
      console.log(`❌ Redis setup failed: ${error}`);
    }
  }

  /**
   * Generate performance optimization recommendations
   */
  generateOptimizationRecommendations(): void {
    console.log('\n📋 Performance Optimization Recommendations:');
    
    const recommendations = [
      {
        category: 'Database Indexing',
        items: [
          'Add composite indexes on frequently queried column combinations',
          'Consider partial indexes for filtered queries (e.g., active users only)',
          'Review and optimize JOIN operations with proper indexing',
        ],
      },
      {
        category: 'Caching Strategy',
        items: [
          'Cache user profile data with 15-minute TTL',
          'Cache achievement definitions (rarely change)',
          'Cache daily/weekly analytics with appropriate TTL',
          'Implement Redis-based session storage for better scalability',
        ],
      },
      {
        category: 'Query Optimization',
        items: [
          'Use pagination for large result sets',
          'Implement query result caching for expensive analytics',
          'Consider materialized views for complex reporting queries',
          'Optimize N+1 query problems in API endpoints',
        ],
      },
      {
        category: 'Application Performance',
        items: [
          'Implement connection pooling for database connections',
          'Add compression middleware for API responses',
          'Use lazy loading for non-critical data',
          'Implement request batching for multiple related operations',
        ],
      },
      {
        category: 'Monitoring & Alerts',
        items: [
          'Set up query performance monitoring',
          'Monitor cache hit ratios',
          'Track API response times',
          'Set up alerts for slow queries (>1s)',
        ],
      },
    ];

    recommendations.forEach(category => {
      console.log(`\n🎯 ${category.category}:`);
      category.items.forEach(item => {
        console.log(`   • ${item}`);
      });
    });
  }

  /**
   * Run comprehensive performance analysis
   */
  async runFullAnalysis(): Promise<void> {
    console.log('🚀 Starting comprehensive performance analysis...\n');
    
    await this.analyzeDatabasePerformance();
    await this.setupCaching();
    this.generateOptimizationRecommendations();
    
    console.log('\n🎉 Performance analysis completed!');
    console.log('Review the recommendations above to optimize your Growth Bank System.');
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.redisClient.isOpen) {
        await this.redisClient.quit();
      }
    } catch (error) {
      console.log('Warning: Could not properly close Redis connection');
    }
  }
}

// Export for use in scripts
export default PerformanceOptimizer;

// If run directly
if (require.main === module) {
  const optimizer = new PerformanceOptimizer();
  
  optimizer.runFullAnalysis()
    .then(() => optimizer.cleanup())
    .catch(error => {
      console.error('Performance analysis failed:', error);
      process.exit(1);
    });
}