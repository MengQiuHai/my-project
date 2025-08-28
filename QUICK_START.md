# 价值掠夺者成长银行系统 - 快速启动指南

## 🎯 项目概述

价值掠夺者成长银行是一个创新的学习管理平台，将学习过程完全游戏化。通过量化学习投入和成果为"成长金币"，结合动态衰减、成就徽章和奖励兑换等机制，为学习者提供持续的动力和清晰的反馈。

### 核心特性 ✨

- **🪙 智能金币系统**: 根据专注时间、学习成果和难度系数自动计算奖励
- **⏰ 知识衰减机制**: 基于遗忘曲线的金币衰减，鼓励及时复习巩固
- **🏆 成就徽章系统**: 丰富的成就体系，激励长期学习
- **🎁 奖励兑换商店**: 个性化奖励清单，用金币兑换学习激励
- **📊 深度数据分析**: 详细的学习统计和可视化图表
- **🔗 外部任务接入**: 支持其他学习应用的任务同步

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 16.0.0
- **PostgreSQL**: >= 12.0  
- **Redis**: >= 6.0
- **npm**: >= 8.0.0

### 1. 克隆项目

```bash
git clone <repository-url>
cd growth-bank-system
```

### 2. 安装依赖

```bash
# 安装后端依赖
cd backend && npm install

# 安装前端依赖
cd ../frontend && npm install
```

### 3. 配置环境

```bash
# 后端环境配置
cd backend
cp .env.example .env

# 前端环境配置  
cd ../frontend
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接等信息：

```env
# 后端 .env 示例
DB_HOST=localhost
DB_PORT=5432
DB_NAME=growth_bank
DB_USER=postgres
DB_PASSWORD=your_password

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your_jwt_secret_key
```

### 4. 数据库设置

```bash
cd backend

# 运行数据库迁移
npm run migrate

# 插入初始数据
npm run seed
```

### 5. 启动应用

```bash
# 启动后端服务 (端口 3000)
cd backend
npm run dev

# 启动前端应用 (端口 3001)
cd frontend  
npm start
```

### 6. 访问应用

- **前端界面**: http://localhost:3001
- **后端API**: http://localhost:3000
- **健康检查**: http://localhost:3000/health

## 📚 已实现功能

### ✅ 核心功能模块

1. **用户认证系统**
   - 用户注册/登录
   - JWT令牌认证
   - 个人资料管理
   - 权限控制

2. **学习会话管理**  
   - 创建/编辑/删除学习记录
   - 自动金币计算
   - 会话统计分析
   - 历史记录查询

3. **金币计算引擎**
   - 智能金币奖励算法
   - 专注时间奖励
   - 成果数量奖励  
   - 难度系数加成
   - 连续学习奖励
   - 首次完成奖励
   - 高难度挑战奖励

4. **金币衰减机制**
   - 基于遗忘曲线的衰减算法
   - 可配置衰减规则
   - 定时自动执行
   - 衰减历史追踪
   - 衰减预测分析

5. **数据库架构**
   - 完整的表结构设计
   - 数据迁移脚本
   - 种子数据初始化
   - 索引优化

6. **前端界面**
   - 现代化设计界面
   - 响应式布局
   - 用户友好的交互
   - 状态管理 (Zustand)

### 🔄 API 接口

#### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录  
- `GET /api/auth/profile` - 获取用户信息
- `PUT /api/auth/profile` - 更新用户信息
- `PUT /api/auth/password` - 修改密码

#### 学习会话接口
- `POST /api/sessions` - 创建学习会话
- `GET /api/sessions` - 获取会话列表
- `GET /api/sessions/:id` - 获取单个会话
- `PUT /api/sessions/:id` - 更新会话
- `DELETE /api/sessions/:id` - 删除会话
- `GET /api/sessions/stats` - 获取统计数据

#### 金币系统接口
- `GET /api/coins/balance` - 获取金币余额
- `GET /api/coins/history` - 获取金币历史
- `GET /api/coins/summary` - 获取金币摘要
- `POST /api/coins/preview` - 预览金币计算
- `GET /api/coins/leaderboard` - 获取排行榜

#### 衰减系统接口  
- `GET /api/decay/history` - 获取衰减历史
- `GET /api/decay/statistics` - 获取衰减统计
- `GET /api/decay/prediction` - 获取衰减预测
- `POST /api/decay/trigger` - 手动触发衰减(管理员)

## 🏗️ 技术架构

### 后端技术栈
- **Node.js + Express**: 服务器框架
- **TypeScript**: 类型安全的JavaScript
- **PostgreSQL**: 主要数据库
- **Redis**: 缓存和会话存储
- **Knex.js**: 数据库查询构建器
- **JWT**: 用户认证
- **node-cron**: 定时任务调度

### 前端技术栈  
- **React 18**: 用户界面框架
- **TypeScript**: 类型安全开发
- **Tailwind CSS**: 原子化CSS框架
- **Zustand**: 轻量级状态管理
- **React Router**: 路由管理
- **React Hook Form**: 表单处理
- **React Hot Toast**: 通知组件

### 开发工具
- **ESLint**: 代码风格检查
- **Prettier**: 代码格式化
- **Jest**: 单元测试框架

## 📦 项目结构

```
growth-bank-system/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── controllers/     # 控制器层
│   │   ├── services/        # 业务逻辑层  
│   │   ├── models/          # 数据模型
│   │   ├── routes/          # 路由定义
│   │   ├── middleware/      # 中间件
│   │   ├── config/          # 配置文件
│   │   └── utils/           # 工具函数
│   ├── database/
│   │   ├── migrations/      # 数据库迁移
│   │   └── seeds/           # 初始数据
│   └── tests/               # 测试文件
├── frontend/                # 前端应用
│   ├── src/
│   │   ├── components/      # 组件
│   │   ├── pages/           # 页面
│   │   ├── services/        # API服务
│   │   ├── store/           # 状态管理
│   │   ├── types/           # 类型定义
│   │   └── utils/           # 工具函数
│   └── public/              # 静态资源
└── docs/                    # 文档
```

## 🔮 待实现功能

1. **成就系统** (开发中)
   - 徽章定义管理
   - 自动成就检测
   - 成就通知系统

2. **奖励兑换系统**
   - 个人奖励清单
   - 金币兑换流程
   - 兑换历史管理

3. **数据分析与可视化**
   - 学习趋势图表
   - 效率分析报告
   - 个性化建议

4. **系统测试与优化**
   - 单元测试覆盖
   - 集成测试
   - 性能优化

## 🤝 开发指南

### 代码风格
- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 组件和函数使用清晰的命名
- 添加适当的注释和文档

### 提交规范
- `feat:` 新功能
- `fix:` 修复bug  
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关

### 数据库操作
- 使用 Knex.js 查询构建器
- 所有数据库修改通过迁移文件
- 重要数据变更需要回滚方案

## 📞 支持

如有问题或建议，请：
1. 查看项目文档
2. 搜索已有的Issue  
3. 创建新的Issue描述问题
4. 参与讨论和改进

---

**🎯 让学习变得有趣且高效！通过游戏化机制，将每一分钟的学习投入都转化为可见的成长和奖励。**