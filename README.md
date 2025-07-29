# 易测平台 (EasyTest Platform)

> 智能化测试解决方案 - 通过自然语言描述测试需求，系统自动解析、生成可执行脚本、执行录屏并存储结果

## 🚀 项目概述

易测平台是一个基于AI的智能化测试解决方案，旨在让测试变得简单高效。用户只需用自然语言描述测试需求，系统就能自动解析、生成可执行脚本、执行录屏并存储结果。

### ✨ 核心特性

- **🤖 智能需求解析**: 使用自然语言描述测试需求，AI大模型自动解析转化为结构化测试步骤
- **⚡ 自动脚本生成**: 基于Playwright自动生成可执行的浏览器操作脚本，无需手动编写代码
- **📹 录屏与结果管理**: 执行测试时同步录屏，完整记录测试过程，便于问题定位和结果分析
- **👥 用户管理系统**: 完整的用户注册、登录、权限管理功能
- **📊 测试记录管理**: 查看历史测试记录、结果分析和录屏回放

## 🏗️ 项目架构

```
easyTest/
├── frontend/                 # Vue.js前端应用
│   ├── src/
│   │   ├── components/      # Vue组件
│   │   │   ├── base/       # 基础UI组件
│   │   │   └── layout/     # 布局组件
│   │   ├── views/          # 页面组件
│   │   │   ├── dashboard/  # 仪表板页面
│   │   │   └── ...         # 其他页面
│   │   ├── stores/         # Pinia状态管理
│   │   ├── router/         # Vue Router路由
│   │   ├── services/       # API服务
│   │   ├── types/          # TypeScript类型定义
│   │   └── assets/         # 静态资源
│   ├── public/             # 公共资源
│   ├── package.json        # 前端依赖
│   ├── vite.config.ts      # Vite配置
│   └── tailwind.config.js  # Tailwind CSS配置
├── backend/                 # Node.js后端服务
│   ├── src/
│   │   ├── config/         # 配置文件
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # API路由
│   │   ├── middleware/     # 中间件
│   │   ├── utils/          # 工具函数
│   │   └── app.js          # 应用入口
│   ├── package.json        # 后端依赖
│   └── .env                # 环境变量
├── .gitignore              # Git忽略文件
└── README.md               # 项目文档
```

## 🛠️ 技术栈

### 前端技术栈
- **框架**: Vue 3.5.12 (Composition API)
- **构建工具**: Vite 5.4.10
- **语言**: TypeScript 5.6.2
- **路由**: Vue Router 4.4.5
- **状态管理**: Pinia 2.2.4
- **UI框架**: Tailwind CSS 3.4.14
- **图标**: Heroicons 2.1.5
- **HTTP客户端**: Axios
- **代码质量**: ESLint + Prettier

### 后端技术栈
- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: MongoDB
- **ODM**: Mongoose
- **认证**: JWT (JSON Web Token)
- **密码加密**: bcryptjs
- **数据验证**: Joi
- **安全**: helmet, express-rate-limit
- **日志**: morgan
- **CORS**: cors

## 📋 功能特性

### 🔐 用户认证系统
- 用户注册（邮箱、手机号、密码）
- 用户登录（JWT认证）
- 密码加密存储
- 登录历史记录
- 用户信息管理

### 🧪 测试管理
- 智能需求解析
- 自动脚本生成
- 测试执行监控
- 录屏功能
- 结果分析报告

### 📊 数据管理
- MongoDB数据库
- 用户数据管理
- 测试记录存储
- 登录历史追踪

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- MongoDB >= 4.0
- npm >= 8.0.0

### 1. 克隆项目
```bash
git clone <repository-url>
cd easyTest
```

### 2. 安装依赖

#### 前端依赖
```bash
cd frontend
npm install
```

#### 后端依赖
```bash
cd backend
npm install
```

### 3. 环境配置

#### 后端环境变量
```bash
cd backend
cp env.example .env
```

编辑 `.env` 文件：
```env
# 服务器配置
PORT=3001
NODE_ENV=development

# MongoDB配置
MONGODB_URI=mongodb://localhost:27017/easyTest

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# 安全配置
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS配置
CORS_ORIGIN=http://localhost:3000
```

### 4. 启动MongoDB
```bash
# macOS (使用Homebrew)
brew services start mongodb-community

# 或者直接启动
mongod
```

### 5. 启动服务

#### 启动后端服务
```bash
cd backend
npm run dev
```
后端服务将在 `http://localhost:3001` 启动

#### 启动前端服务
```bash
cd frontend
npm run dev
```
前端服务将在 `http://localhost:3000` 启动

### 6. 访问应用
打开浏览器访问 `http://localhost:3000`

## 📖 使用指南

### 用户注册
1. 访问首页，点击"注册"按钮
2. 填写邮箱、手机号、密码等信息
3. 提交注册表单
4. 注册成功后自动登录

### 用户登录
1. 访问登录页面
2. 输入邮箱和密码
3. 点击登录按钮
4. 登录成功后跳转到仪表板

### 演示账户
- **邮箱**: `test@example.com`
- **密码**: `Test123!`

## 🔧 开发指南

### 前端开发
```bash
cd frontend
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览构建结果
npm run lint         # 代码检查
```

### 后端开发
```bash
cd backend
npm run dev          # 启动开发服务器
npm start            # 启动生产服务器
```

### 数据库操作
```bash
# 连接MongoDB
mongosh

# 查看数据库
show dbs

# 使用easyTest数据库
use easyTest

# 查看集合
show collections

# 查看用户数据
db.members.find()
```

## 📡 API文档

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/logout` - 用户登出
- `POST /api/auth/refresh` - 刷新令牌
- `GET /api/auth/login-history` - 获取登录历史

### 健康检查
- `GET /api/health` - 服务健康检查
- `GET /api` - API信息

## 🧪 测试

### 前端测试
```bash
cd frontend
npm run test
```

### 后端测试
```bash
cd backend
npm test
```

### API测试
```bash
# 健康检查
curl http://localhost:3001/api/health

# 用户注册
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "13800138000",
    "password": "Test123!",
    "confirmPassword": "Test123!"
  }'

# 用户登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

## 🚀 部署

### 前端部署
```bash
cd frontend
npm run build
# 将 dist/ 目录部署到Web服务器
```

### 后端部署
```bash
cd backend
npm install --production
npm start
# 使用PM2或其他进程管理器
```

### 环境变量配置
生产环境需要配置以下环境变量：
- `NODE_ENV=production`
- `MONGODB_URI` - 生产数据库连接
- `JWT_SECRET` - 安全的JWT密钥
- `CORS_ORIGIN` - 允许的前端域名

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📝 开发规范

### 代码风格
- 使用ESLint和Prettier保持代码风格一致
- 遵循TypeScript类型定义
- 使用Vue 3 Composition API
- 遵循RESTful API设计原则

### 提交规范
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式调整
- refactor: 代码重构
- test: 测试相关
- chore: 构建过程或辅助工具的变动

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

- 项目维护者: [Your Name]
- 邮箱: [your.email@example.com]
- 项目链接: [https://github.com/your-username/easyTest]

## 🙏 致谢

- Vue.js 团队提供的优秀前端框架
- Express.js 团队提供的后端框架
- MongoDB 团队提供的数据库解决方案
- Tailwind CSS 团队提供的样式框架

---

**易测平台** - 让测试变得简单高效 🚀 