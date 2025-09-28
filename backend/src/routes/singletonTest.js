import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { successResponse, errorResponse, serverErrorResponse } from '../utils/response.js';
import mcpPlaywrightService from '../services/mcpPlaywrightService.js';

const router = express.Router();

/**
 * 执行单例测试
 * POST /api/singleton-test/execute
 */
router.post('/execute', authenticateToken, async (req, res) => {
  try {
    const { testCase, options = {} } = req.body;
    const userId = req.user._id;

    console.log('开始执行单例测试:', {
      title: testCase.title,
      entryUrl: testCase.entryUrl,
      level: testCase.level,
      userId
    });

    // 验证必要参数
    if (!testCase || !testCase.title || !testCase.entryUrl || !testCase.description) {
      return errorResponse(res, '缺少必要的测试用例参数', 400);
    }

    // 执行测试用例
    const result = await mcpPlaywrightService.executeTestCase(
      testCase,
      options,
      (logMessage) => {
        // 这里可以实现实时日志推送，暂时只打印到控制台
        console.log(`[单例测试日志] ${logMessage}`);
      }
    );

    if (!result.success) {
      return errorResponse(res, result.error || '测试执行失败', 400);
    }

    return successResponse(res, result, '单例测试执行成功');

  } catch (error) {
    console.error('单例测试执行失败:', error);
    return serverErrorResponse(res, '单例测试执行失败');
  }
});

/**
 * 检查MCP服务器健康状态
 * GET /api/singleton-test/health
 */
router.get('/health', authenticateToken, async (req, res) => {
  try {
    console.log('检查MCP服务器健康状态');

    const isHealthy = await mcpPlaywrightService.healthCheck();
    const tools = mcpPlaywrightService.getAvailableTools();

    const healthData = {
      isConnected: isHealthy,
      toolsCount: tools.length,
      tools: tools.map(tool => ({
        name: tool.name,
        description: tool.description || '无描述'
      }))
    };

    if (isHealthy) {
      return successResponse(res, healthData, 'MCP服务器运行正常');
    } else {
      return errorResponse(res, 'MCP服务器连接失败', 503, healthData);
    }

  } catch (error) {
    console.error('MCP健康检查失败:', error);
    return serverErrorResponse(res, 'MCP健康检查失败');
  }
});

/**
 * 获取MCP可用工具列表
 * GET /api/singleton-test/tools
 */
router.get('/tools', authenticateToken, async (req, res) => {
  try {
    console.log('获取MCP可用工具列表');

    // 确保连接
    const isConnected = await mcpPlaywrightService.healthCheck();
    if (!isConnected) {
      return errorResponse(res, 'MCP服务器未连接', 503);
    }

    const tools = mcpPlaywrightService.getAvailableTools();
    
    return successResponse(res, {
      tools: tools.map(tool => ({
        name: tool.name,
        description: tool.description || '无描述',
        inputSchema: tool.inputSchema || {}
      })),
      count: tools.length
    }, '获取工具列表成功');

  } catch (error) {
    console.error('获取MCP工具列表失败:', error);
    return serverErrorResponse(res, '获取工具列表失败');
  }
});

/**
 * 流式执行单例测试 - 使用Server-Sent Events
 * GET /api/singleton-test/stream
 */
router.get('/stream', authenticateToken, async (req, res) => {
  try {
    const { title, entryUrl, description, level } = req.query;
    const userId = req.user._id;

    console.log('开始流式执行单例测试:', { title, entryUrl, level, userId });

    // 验证必要参数
    if (!title || !entryUrl || !description) {
      return errorResponse(res, '缺少必要的测试用例参数', 400);
    }

    // 监控连接状态
    req.on('close', () => {
      console.log('SSE连接已关闭');
    });

    req.on('error', (error) => {
      console.error('SSE连接错误:', error);
    });

    // 设置SSE头部
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || 'http://localhost:10060',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Cache-Control, Authorization, Content-Type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'X-Accel-Buffering': 'no' // 禁用nginx缓冲
    });

    // 发送连接建立消息
    res.write(`data: ${JSON.stringify({
      type: 'connection',
      message: 'SSE连接已建立',
      timestamp: new Date().toISOString()
    })}\n\n`);

    // 构建测试用例对象
    const testCase = {
      title,
      entryUrl,
      description,
      level: level || '中'
    };

    // 发送开始消息
    res.write(`data: ${JSON.stringify({
      type: 'start',
      message: '开始执行单例测试',
      timestamp: new Date().toISOString()
    })}\n\n`);

    // 创建实时日志回调函数
    const logCallback = (message) => {
      console.log(`[单例测试流式日志] ${message}`);
      res.write(`data: ${JSON.stringify({
        type: 'log',
        message: message.replace('LOG: ', ''),
        timestamp: new Date().toISOString()
      })}\n\n`);
    };

    // 执行测试用例
    const result = await mcpPlaywrightService.executeTestCase(
      testCase,
      {},
      logCallback
    );

    // 发送最终结果
    res.write(`data: ${JSON.stringify({
      type: 'complete',
      success: result.success,
      summary: result.summary,
      error: result.error,
      timestamp: new Date().toISOString()
    })}\n\n`);

    res.end();

  } catch (error) {
    console.error('流式执行单例测试失败:', error);
    
    // 发送错误事件
    res.write(`data: ${JSON.stringify({
      type: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    })}\n\n`);
    res.end();
  }
});

/**
 * 测试MCP连接
 * POST /api/singleton-test/test-connection
 */
router.post('/test-connection', authenticateToken, async (req, res) => {
  try {
    console.log('测试MCP连接');

    // 尝试连接
    await mcpPlaywrightService.connect();
    const tools = mcpPlaywrightService.getAvailableTools();

    return successResponse(res, {
      isConnected: true,
      toolsCount: tools.length,
      message: 'MCP连接测试成功'
    }, 'MCP连接测试成功');

  } catch (error) {
    console.error('MCP连接测试失败:', error);
    return errorResponse(res, `MCP连接测试失败: ${error.message}`, 500);
  }
});

export default router;
