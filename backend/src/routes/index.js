import express from 'express';
import authRoutes from './auth.js';
import testCaseRoutes from './testCase.js';
import videoRoutes from './video.js';
import aiChatRoutes from './aiChat.js';
import testResultRoutes from './testResult.js';
import testCaseDirectoryRoutes from './testCaseDirectory.js';
import testPlanRoutes from './testPlan.js';
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
      'test-directories': '/api/test-directories',
      'test-plans': '/api/test-plans',
      videos: '/api/videos',
      'test-results': '/api/test-results',
      'ai-chat': '/api/ai-chat',
      health: '/api/health'
    },
    documentation: 'API文档待完善'
  }, 'API服务正常');
});

// 认证路由
router.use('/auth', authRoutes);

// 测试用例路由
router.use('/testcases', testCaseRoutes);

// 用例目录路由
router.use('/test-directories', testCaseDirectoryRoutes);

// 视频管理路由
router.use('/videos', videoRoutes);

// AI对话路由
router.use('/ai-chat', aiChatRoutes);

// 测试结果路由
router.use('/test-results', testResultRoutes);

// 测试计划路由
router.use('/test-plans', testPlanRoutes);

export default router;