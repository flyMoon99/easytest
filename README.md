# 易测平台 🚀

> 智能化测试解决方案 - 让测试变得简单高效

易测平台是一个基于 Vue 3.5 的现代化智能测试管理系统，通过自然语言描述测试需求，系统自动解析、生成可执行脚本、执行录屏并存储结果，大幅降低测试脚本编写门槛，提升测试效率。

## ✨ 核心特性

### 🧠 智能化需求解析
- **自然语言输入** - 用简单的中文描述测试需求
- **AI大模型解析** - 自动转化为结构化测试步骤
- **智能脚本生成** - 基于Playwright生成可执行脚本

### 🎬 自动录屏与回放
- **完整测试录屏** - 记录整个测试执行过程
- **分步骤录屏** - 每个测试步骤独立录屏片段
- **录屏回放** - 便于问题定位和结果分析

### 📊 可视化管理
- **测试记录管理** - 完整的测试历史和状态追踪
- **数据统计分析** - 测试成功率、执行时长等统计
- **Playwright脚本展示** - 可视化的脚本代码展示

### 🎨 现代化UI设计
- **白色底色设计** - 简洁现代的视觉风格
- **响应式布局** - 完美适配桌面端和移动端
- **流畅交互体验** - 优雅的动画和过渡效果

## 🛠️ 技术栈

### 前端框架
- **Vue 3.5** - 渐进式JavaScript框架，使用组合式API
- **TypeScript** - 提供完整的类型安全保障
- **Vite** - 现代化构建工具，极速热更新

### UI与样式
- **Tailwind CSS** - 原子化CSS框架
- **自定义组件库** - 高度复用的UI组件系统
- **Heroicons** - 精美的SVG图标库

### 状态管理
- **Pinia** - Vue官方推荐的状态管理库
- **Vue Router** - 单页应用路由管理
- **认证守卫** - 智能的路由权限控制

### 开发工具
- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **PostCSS** - CSS后处理器

## 📁 项目结构

```
easyTest/
├── public/                 # 静态资源
├── src/
│   ├── assets/            # 资源文件
│   │   └── styles/        # 全局样式
│   ├── components/        # 组件库
│   │   ├── base/          # 基础组件
│   │   ├── layout/        # 布局组件
│   │   └── business/      # 业务组件
│   ├── composables/       # 组合式API
│   ├── stores/            # Pinia状态管理
│   ├── types/             # TypeScript类型定义
│   ├── utils/             # 工具函数
│   ├── views/             # 页面组件
│   │   └── dashboard/     # 会员中心页面
│   ├── router/            # 路由配置
│   └── main.ts            # 应用入口
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 🎯 主要页面

### 🏠 易测平台首页
- 品牌展示和产品介绍
- 核心特性展示
- 用户认证入口

### 🔐 用户认证系统
- **登录页面** - 邮箱密码登录，记住登录状态
- **注册页面** - 新用户注册，完整表单验证

### 📱 会员中心
- **仪表板** - 数据统计、最近测试、快速操作
- **新增测试** - 智能表单、使用说明、实时验证
- **测试记录** - 列表展示、状态筛选、操作管理
- **测试详情** - Playwright脚本展示、录屏播放

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

访问 `http://localhost:3000` 即可查看应用

### 构建生产版本
```bash
npm run build
```

### 代码检查
```bash
npm run lint
```

### 类型检查
```bash
npm run type-check
```

## 💡 使用指南

### 1. 创建测试
1. 登录系统进入会员中心
2. 点击"新增测试"按钮
3. 填写测试信息：
   - **测试标题**：如"用户登录功能测试"
   - **测试入口URL**：如"https://example.com/login"
   - **测试描述**：用自然语言详细描述测试步骤

### 2. 测试描述示例
```
测试用户登录功能：
1. 访问登录页面，验证页面是否正常加载
2. 输入正确的用户名和密码
3. 点击登录按钮
4. 验证是否成功跳转到首页
5. 检查用户信息是否正确显示
```

### 3. 查看测试结果
- 在测试记录页面查看所有测试
- 点击"详情"查看具体执行过程
- 观看完整录屏或分步骤录屏
- 查看自动生成的Playwright脚本

## 🔧 核心组件

### BaseButton
```vue
<BaseButton variant="primary" size="lg" :loading="false">
  按钮文字
</BaseButton>
```

### BaseInput
```vue
<BaseInput
  v-model="value"
  label="标签"
  placeholder="占位符"
  :error-message="error"
/>
```

### BaseCard
```vue
<BaseCard title="卡片标题">
  <template #header>自定义头部</template>
  卡片内容
  <template #footer>自定义底部</template>
</BaseCard>
```

### BaseModal
```vue
<BaseModal :show="visible" title="模态框标题" @close="handleClose">
  模态框内容
  <template #footer>自定义底部按钮</template>
</BaseModal>
```

## 📊 功能特性详解

### 智能需求解析
系统采用自然语言处理技术，将用户的中文描述转换为结构化的测试步骤：

**输入示例：**
```
测试商品搜索功能：
1. 打开首页，找到搜索框
2. 输入"手机"进行搜索
3. 验证搜索结果页面
4. 点击第一个商品查看详情
```

**生成脚本：**
```javascript
await page.goto('https://example.com');
await page.click('#search-input');
await page.fill('#search-input', '手机');
await page.click('#search-button');
await page.waitForSelector('.search-results');
await page.click('.product-item:first-child');
```

### 录屏功能
- **完整录屏**：记录整个测试执行过程
- **分段录屏**：每个Playwright步骤对应一个录屏片段
- **录屏回放**：支持播放控制、倍速播放等功能

### 状态管理
- **认证状态**：用户登录状态持久化
- **测试数据**：测试记录、统计信息实时更新
- **UI状态**：加载状态、错误提示等

## 🎨 设计系统

### 色彩方案
- **主色调**：白色背景 (#FFFFFF)
- **辅助色**：浅灰色 (#F8F9FA)、深灰色 (#6B7280)
- **强调色**：蓝色 (#3B82F6)、绿色 (#10B981)、红色 (#EF4444)

### 字体系统
- **主字体**：Inter
- **代码字体**：等宽字体用于代码展示

### 组件规范
- **圆角**：统一使用 8px 圆角
- **阴影**：soft/medium/strong 三级阴影系统
- **间距**：基于 4px 的间距系统

## 🔒 安全特性

- **路由守卫**：未登录用户自动重定向到登录页
- **表单验证**：前端完整的表单验证机制
- **XSS防护**：所有用户输入都进行转义处理
- **状态持久化**：支持localStorage和sessionStorage

## 🚀 部署说明

### 构建优化
- **代码分割**：路由级别和组件级别的懒加载
- **资源压缩**：CSS和JavaScript自动压缩
- **Tree Shaking**：自动移除未使用的代码

### 生产环境
```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📝 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详细信息

## 📞 联系我们

- **项目名称**：易测平台
- **开发团队**：智能化测试解决方案团队
- **技术支持**：请提交 Issue 或 Pull Request

---

**易测平台** - 让测试变得简单高效 🚀 