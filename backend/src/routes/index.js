import express from 'express';
import authRoutes from './auth.js';
import testCaseRoutes from './testCase.js';
import videoRoutes from './video.js';
import aiChatRoutes from './aiChat.js';
import { successResponse } from '../utils/response.js';

const router = express.Router();

/**
 * 健康检查
 * GET /api/health
 */
router.get('/health', (req, res) => {
  return successResponse(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  }, '服务运行正常');
});

/**
 * API信息
 * GET /api
 */
router.get('/', (req, res) => {
  return successResponse(res, {
    name: '易测平台后端API',
    version: '1.0.0',
    description: '智能化测试平台后端服务',
    endpoints: {
      auth: '/api/auth',
      testcases: '/api/testcases',
      videos: '/api/videos',
      health: '/api/health'
    },
    documentation: 'API文档待完善'
  }, 'API服务正常');
});

// 认证路由
router.use('/auth', authRoutes);

// 测试用例路由
router.use('/testcases', testCaseRoutes);

// 视频管理路由
router.use('/videos', videoRoutes);

// AI对话路由
router.use('/ai-chat', aiChatRoutes);

export default router;