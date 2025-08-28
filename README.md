# 🚀 Growth Bank System - 价值掠夺者成长银行

A comprehensive gamified learning management platform that transforms long-term study goals into engaging, reward-driven experiences. The system simulates a "bank" where users earn "growth coins" through learning activities, with sophisticated decay mechanisms that mirror knowledge retention patterns.

## 🎯 System Overview

The Growth Bank System addresses the motivation challenges in long-term learning scenarios (like exam preparation, skill development) by implementing:

- **🪙 Dynamic Coin System**: Earn growth coins through focus time, task completion, and difficulty challenges
- **📉 Knowledge Decay Simulation**: Coins decay over time based on forgetting curves, encouraging regular review
- **🏆 Achievement Framework**: Unlock badges and milestones to maintain engagement
- **🎁 Reward Marketplace**: Redeem coins for real-world incentives
- **📊 Comprehensive Analytics**: Track progress, trends, and performance insights
- **🔄 Automated Scheduling**: Background processes for decay calculation and achievement detection

## ✨ Key Features

### 🎓 Learning Management
- **Multi-Subject Support**: Mathematics, Physics, Chemistry, English, and more
- **Difficulty Scaling**: Easy, Medium, Hard, Expert levels with coefficient multipliers
- **Session Tracking**: Detailed logging of focus time, results, and efficiency
- **Task Variety**: Practice problems, exercises, projects, and research tasks

### 🪙 Sophisticated Coin Economy
- **Multi-Factor Calculation**: 
  - Focus time rewards (tiered rates: 15-30min, 30-60min, 60-120min, 120min+)
  - Result quantity bonuses (scaled by difficulty coefficient)
  - Performance efficiency multipliers
- **Bonus Systems**:
  - 🔥 Streak bonuses (3, 7, 14, 30+ day streaks)
  - 🎯 First attempt bonuses
  - 💪 Difficulty challenge rewards
  - 📅 Consistency incentives

### ⏰ Intelligent Decay Mechanism
- **Configurable Decay Rules**: 
  - Percentage-based or fixed amount decay
  - Subject-specific or universal rules
  - Threshold-based activation (e.g., after 7 days)
- **Automated Scheduling**: 
  - Daily decay calculations at 2 AM
  - Hourly emergency checks for critical rules
  - Cron-based task management
- **Predictive Analytics**: Forecast future decay to plan review sessions

### 🏆 Achievement System
- **Progress Milestones**: Total sessions, focus time, coins earned
- **Streak Achievements**: Consistency rewards for daily learning
- **Subject Mastery**: Expertise recognition in specific areas
- **Challenge Completions**: Difficulty-based accomplishments
- **Special Events**: Time-limited achievement opportunities

### 🎁 Reward Marketplace
- **Flexible Rewards**: Study breaks, entertainment, physical items
- **Smart Pricing**: Dynamic pricing based on user behavior
- **Cooldown Management**: Prevent reward abuse with usage limits
- **Recommendation Engine**: Personalized reward suggestions
- **Redemption Tracking**: Complete transaction history

### 📊 Advanced Analytics
- **Learning Trends**: Daily, weekly, monthly progress visualization
- **Subject Analysis**: Performance breakdown by topic
- **Efficiency Metrics**: Coins per hour, consistency scores
- **Comparative Analytics**: Ranking and percentile positioning
- **Personalized Insights**: AI-driven recommendations and observations
- **Data Export**: CSV/JSON export for external analysis

## 🏗️ Technical Architecture

### Backend Stack
- **Runtime**: Node.js 16+ with TypeScript
- **Framework**: Express.js with comprehensive middleware
- **Database**: PostgreSQL 12+ with optimized indexing
- **Caching**: Redis for sessions and performance
- **Authentication**: JWT-based with refresh tokens
- **Scheduling**: node-cron for automated tasks
- **Validation**: Joi for input sanitization
- **Testing**: Jest with comprehensive coverage

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **State Management**: Zustand for global state
- **Styling**: Tailwind CSS with responsive design
- **Forms**: React Hook Form with validation
- **Animations**: Framer Motion for smooth interactions
- **Charts**: Chart.js for analytics visualization
- **Icons**: Heroicons for consistent UI
- **Notifications**: React Hot Toast for user feedback

### Database Design
#### Core Tables (11 total)
1. **users** - User profiles and authentication
2. **learning_sessions** - Session tracking with coin integration
3. **task_definitions** - Available learning tasks
4. **difficulties** - Difficulty levels and coefficients
5. **coin_ledger** - Complete transaction history
6. **achievements** - Achievement definitions
7. **user_achievements** - User achievement records
8. **rewards** - Available rewards marketplace
9. **redemptions** - Reward redemption history
10. **coin_decay_rules** - Configurable decay parameters
11. **knex_migrations** - Database version control

#### Optimizations
- Composite indexes on frequently queried columns
- Foreign key constraints for data integrity
- Efficient pagination for large datasets
- Database connection pooling

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm 8+
- PostgreSQL 12+ with uuid extension
- Redis 6+ (optional but recommended)
- Git for version control

### Installation

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd growth-bank-system
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Configure environment
   cp .env.example .env
   # Edit .env with your database credentials
   
   # Setup database
   npm run migrate
   npm run seed
   
   # Start development server
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   
   # Configure environment
   cp .env.example .env.local
   # Edit .env.local with API URL
   
   # Start development server
   npm start
   ```

4. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Create account and start learning!

### Testing
```bash
# Backend tests
cd backend
npm test                    # Run all tests
npm run test:coverage      # With coverage report
npm run test:integration   # Integration tests only
npm run health:check       # System health verification

# Performance analysis
npm run performance:analyze
```

## 📚 核心模块

### 1. 任务管理模块
- 任务类型定义和配置
- 学习会话记录
- 任务完成验证

### 2. 金币计算引擎
- 专注金币计算（基于时间）
- 成果金币计算（基于成果数量和难度）
- 可配置的计算规则

### 3. 衰减机制
- 基于遗忘曲线的金币衰减
- 定时任务执行衰减计算
- 可配置的衰减规则

### 4. 成就系统
- 徽章定义和管理
- 自动成就检查和发放
- 成就条件配置

### 5. 兑换系统
- 个人奖励清单管理
- 金币兑换流程
- 防止透支机制

### 6. 数据分析
- 学习统计报表
- 可视化图表
- 趋势分析

## 🔧 技术栈

- **后端**: Node.js + Express + TypeScript
- **前端**: React + TypeScript + Tailwind CSS
- **数据库**: PostgreSQL + Redis
- **图表**: Recharts
- **任务队列**: Bull (Redis-based)
- **认证**: JWT
- **部署**: Docker + Docker Compose

## 📖 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - User logout

### Learning Session Endpoints
- `GET /api/sessions` - Get user sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions/:id` - Get session details
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session

### Coin System Endpoints
- `GET /api/coins/balance` - Current coin balance
- `GET /api/coins/history` - Transaction history
- `GET /api/coins/stats` - Coin statistics
- `POST /api/coins/calculate` - Manual calculation

### Achievement Endpoints
- `GET /api/achievements` - User achievements
- `POST /api/achievements/check` - Check for new achievements
- `GET /api/achievements/available` - Available achievements

### Reward Endpoints
- `GET /api/rewards` - Available rewards
- `POST /api/rewards/:id/redeem` - Redeem reward
- `GET /api/rewards/history` - Redemption history
- `GET /api/rewards/recommendations` - Recommended rewards

### Analytics Endpoints
- `GET /api/stats/dashboard` - Dashboard summary
- `GET /api/stats/trends` - Learning trends
- `GET /api/stats/performance` - Performance metrics
- `GET /api/stats/comparative` - Comparative analytics
- `GET /api/stats/export` - Export user data

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
# Server
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/growth_bank

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-super-secure-secret-key
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend (.env.local)
```bash
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ENVIRONMENT=development
```

## 📈 Performance Optimization

### Database Optimizations
- Composite indexes on high-traffic queries
- Connection pooling (min: 2, max: 10)
- Query optimization for analytics endpoints
- Efficient pagination strategies

### Caching Strategy
- Redis caching for user sessions
- In-memory caching for frequently accessed data
- Cache invalidation on data updates
- Configurable TTL for different data types

### Application Performance
- Code splitting in React frontend
- Lazy loading for non-critical components
- Optimized bundle sizes
- Compression middleware

## 🛡️ Security Features

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- Role-based access control
- Session management with Redis

### API Security
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS configuration
- Security headers (helmet.js)
- SQL injection prevention

### Data Protection
- Encrypted database connections
- Secure cookie handling
- Environment variable protection
- Audit logging for sensitive operations

## 🚀 Deployment

For production deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md) which covers:

- **Production Environment Setup**
- **Database Configuration & Optimization**
- **Reverse Proxy Setup (Nginx)**
- **SSL/TLS Configuration**
- **Process Management (PM2)**
- **Monitoring & Logging**
- **Security Hardening**
- **Backup Strategies**
- **Performance Tuning**

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Standards
- TypeScript for type safety
- ESLint + Prettier for code formatting
- Jest for testing (aim for 80%+ coverage)
- Conventional commit messages
- Documentation for new features

### Testing Requirements
- Unit tests for all business logic
- Integration tests for API endpoints
- Frontend component testing
- Performance testing for critical paths

## 📝 Changelog

### Version 1.0.0 (Current)
- ✅ Complete user authentication system
- ✅ Advanced coin calculation engine
- ✅ Intelligent decay mechanism
- ✅ Comprehensive achievement system
- ✅ Reward marketplace with redemptions
- ✅ Advanced analytics and reporting
- ✅ Responsive frontend interface
- ✅ Comprehensive testing suite
- ✅ Production deployment configuration

### Planned Features (v1.1.0)
- 📱 Mobile application (React Native)
- 🌐 Multi-language support
- 🔔 Push notifications
- 📊 Advanced data visualization
- 🤖 AI-powered learning recommendations
- 👥 Social features and leaderboards
- 📚 Content management system
- 🔗 Third-party integrations

## 🆘 Support

### Getting Help
1. **Documentation**: Check this README and deployment guide
2. **Health Check**: Run `npm run health:check` in backend
3. **Logs**: Check application logs with `pm2 logs` (production)
4. **Issues**: Open a GitHub issue with detailed reproduction steps

### Common Issues
- **Database Connection**: Verify PostgreSQL is running and credentials are correct
- **Redis Issues**: Redis is optional; system works without it but with reduced performance
- **Port Conflicts**: Default ports are 3000 (frontend) and 3001 (backend)
- **Migration Errors**: Ensure database user has proper permissions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Ebbinghaus Forgetting Curve**: Inspiration for the decay mechanism
- **Gamification Research**: Academic papers on motivation and engagement
- **Open Source Community**: For the amazing tools and libraries
- **Beta Testers**: Early users who provided valuable feedback

---

**Built with ❤️ for learners who want to turn their educational journey into an engaging, rewarding adventure.**

*Transform your learning routine into a game where every study session counts, every achievement matters, and every milestone brings you closer to your goals.*