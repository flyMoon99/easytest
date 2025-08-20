# 易测平台 - 智能化测试解决方案

## 项目简介

易测平台是一个基于Vue 3 + Node.js的智能化测试管理系统，提供测试用例管理、测试计划管理、自动化测试执行等功能。

## 功能特性

### 核心功能
- **测试用例管理**: 支持创建、编辑、删除测试用例，支持目录层级管理
- **测试计划管理**: 支持创建测试计划，关联测试用例，跟踪执行进度
- **自动化测试**: 基于Playwright的自动化测试执行
- **AI智能分析**: 集成AI模型进行测试结果分析和建议
- **视频测试**: 支持视频上传和AI分析

### 新增功能 - 关联用例范围

#### 功能概述
关联用例范围功能提供了完整的测试用例层级展示和管理界面，支持"目录1-目录2-用例"的层级结构展示。

#### 主要特性
1. **层级展示**: 支持多级目录结构，清晰展示用例归属关系
2. **展开/收起**: 支持目录的展开和收起操作，提供全部展开/全部收起功能
3. **表格展示**: 以表格形式展示用例详细信息，包含：
   - 用例名称
   - 需求状态
   - 用例等级
   - 用例状态
   - 用例负责人
   - 最终结果
   - 执行次数
   - 关联的Bug
   - 最后执行人
   - 最后执行时间

4. **批量操作**: 支持批量选择、批量分配、批量更新状态等操作
5. **筛选搜索**: 支持按状态、等级筛选，支持用例名称搜索
6. **统计信息**: 实时显示通过、不通过、阻塞、未执行的用例数量和进度

#### 访问方式
- 在测试计划列表页面点击"关联用例"按钮
- 在测试计划详情页面点击"查看关联用例"按钮
- 直接访问 `/dashboard/test-plan/:id/related-cases` 路由

#### 技术实现
- **前端组件**: `HierarchicalTestCaseTable.vue` - 层级表格组件
- **页面组件**: `TestPlanRelatedCases.vue` - 关联用例页面
- **后端API**: `/api/test-plans/:id/related-cases` - 获取关联用例数据
- **数据结构**: 基于 `directoryPath` 数组构建层级关系

## 技术栈

### 前端
- Vue 3 (Composition API)
- TypeScript
- Tailwind CSS
- Vite
- Pinia (状态管理)

### 后端
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT认证
- Playwright (自动化测试)

## 快速开始

### 环境要求
- Node.js 16+
- MongoDB 4.4+

### 安装依赖
```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

### 环境配置
```bash
# 后端环境配置
cd backend
cp env.example .env
# 编辑 .env 文件，配置数据库连接等信息

# 前端环境配置
cd frontend
# 编辑 vite.config.ts 中的代理配置
```

### 启动服务
```bash
# 启动后端服务
cd backend
npm run dev

# 启动前端服务
cd frontend
npm run dev
```

### 访问应用
- 前端: http://localhost:5173
- 后端API: http://localhost:3000

## 项目结构

```
easyTest/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── components/      # 组件
│   │   │   ├── base/        # 基础组件
│   │   │   ├── directory/   # 目录管理组件
│   │   │   └── testPlan/    # 测试计划组件
│   │   ├── views/           # 页面
│   │   ├── stores/          # 状态管理
│   │   ├── services/        # API服务
│   │   └── types/           # 类型定义
│   └── package.json
├── backend/                  # 后端项目
│   ├── src/
│   │   ├── routes/          # 路由
│   │   ├── models/          # 数据模型
│   │   ├── services/        # 业务逻辑
│   │   └── middleware/      # 中间件
│   └── package.json
└── README.md
```

## 开发指南

### 代码规范
- 使用TypeScript进行类型检查
- 遵循Vue 3 Composition API最佳实践
- 使用ESLint和Prettier进行代码格式化

### 组件开发
- 基础组件放在 `components/base/` 目录
- 业务组件按功能模块组织
- 使用Props和Emits进行组件通信

### API开发
- RESTful API设计
- 统一的响应格式
- 完善的错误处理

## 部署

### 生产环境构建
```bash
# 前端构建
cd frontend
npm run build

# 后端构建
cd backend
npm run build
```

### Docker部署
```bash
# 构建镜像
docker build -t easytest .

# 运行容器
docker run -p 3000:3000 easytest
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 Issue
- 发送邮件
- 项目讨论区 