import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { connectDatabase } from './config/database.js';
import routes from './routes/index.js';
import { errorResponse, serverErrorResponse } from './utils/response.js';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http://localhost:3001"],
    },
  },
}));

// CORS配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 登录接口特殊限制
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5分钟
  max: 20, // 5分钟内最多20次登录尝试
  message: {
    success: false,
    message: '登录尝试过于频繁，请稍后再试',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 全局请求限制
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 5 * 60 * 1000, // 5分钟
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 500, // 限制每个IP 5分钟内最多500个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 请求限制（仅在生产环境中启用）
if (process.env.NODE_ENV === 'production') {
  app.use('/api/', limiter);
} else {
  console.log('开发环境：已禁用请求频率限制');
}

// 日志中间件
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 解析JSON请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static('uploads'));
// 为screenshots路径单独配置CORS
app.use('/screenshots', cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'Content-Type']
}), (req, res, next) => {
  // 设置允许跨域资源访问的响应头
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static('public/screenshots'));

// 为videos路径配置CORS和静态文件服务
app.use('/videos', cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'Content-Type']
}), (req, res, next) => {
  // 设置允许跨域资源访问的响应头
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static('public/uploads/videos'));

// API路由
app.use('/api/auth/login', loginLimiter); // 登录接口特殊限制
app.use('/api', routes);

// 404处理
app.use('*', (req, res) => {
  return errorResponse(res, '接口不存在', 404);
});

// 全局错误处理中间件
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  
  // MongoDB错误处理
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message
    }));
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors,
      timestamp: new Date().toISOString()
    });
  }
  
  // MongoDB重复键错误
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `${field}已存在`,
      timestamp: new Date().toISOString()
    });
  }
  
  // JWT错误
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '无效的令牌',
      timestamp: new Date().toISOString()
    });
  }
  
  // JWT过期错误
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '令牌已过期',
      timestamp: new Date().toISOString()
    });
  }
  
  // 默认服务器错误
  return serverErrorResponse(res, '服务器内部错误', error);
});

// 启动服务器
const startServer = async () => {
  try {
    // 连接数据库
    await connectDatabase();
    
    // 启动HTTP服务器
    app.listen(PORT, () => {
      console.log('🚀 易测平台后端服务启动成功');
      console.log(`📡 服务地址: http://localhost:${PORT}`);
      console.log(`🔗 API文档: http://localhost:${PORT}/api`);
      console.log(`💚 健康检查: http://localhost:${PORT}/api/health`);
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`);
    });
    
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🔄 收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});

// 启动服务器
startServer();

export default app;