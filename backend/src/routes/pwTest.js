import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { successResponse, errorResponse, serverErrorResponse } from '../utils/response.js';
import { 
  runCompletePWTest, 
  executePWTest, 
  runStreamingPWTest
} from '../services/pwTestService.js';
import TestCase from '../models/TestCase.js';

const router = express.Router();

/**
 * 处理SSE连接的OPTIONS请求
 * OPTIONS /api/pw-test/stream/:testCaseId
 */
router.options('/stream/:testCaseId', (req, res) => {
  res.writeHead(200, {
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || 'http://localhost:10060',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Cache-Control, Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Max-Age': '86400'
  });
  res.end();
});

/**
 * 流式执行完整的PW测试流程 - 使用MCP架构
 * GET /api/pw-test/stream/:testCaseId
 */
router.get('/stream/:testCaseId', authenticateToken, async (req, res) => {
  try {
    const { testCaseId } = req.params;
    const { executionMode, browserType } = req.query;
    const userId = req.user._id;

    console.log(`开始流式执行PW测试，测试用例ID: ${testCaseId}`);

    // 监控连接状态
    req.on('close', () => {
      console.log(`SSE连接已关闭，测试用例ID: ${testCaseId}`);
    });

    req.on('error', (error) => {
      console.error(`SSE连接错误，测试用例ID: ${testCaseId}:`, error);
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

    const options = {
      executionMode: executionMode || 'headless',
      browserType: browserType || 'chromium'
    };

    // 开始流式执行
    await runStreamingPWTest(testCaseId, userId, options, res);

  } catch (error) {
    console.error('流式执行PW测试失败:', error);
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack,
      testCaseId,
      userId,
      options
    });
    
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
 * 执行完整的PW测试流程 - 使用MCP架构
 * POST /api/pw-test/run/:testCaseId
 */
router.post('/run/:testCaseId', authenticateToken, async (req, res) => {
  try {
    const { testCaseId } = req.params;
    const { options = {} } = req.body;
    const userId = req.user._id;

    console.log(`开始执行完整PW测试流程，测试用例ID: ${testCaseId}`);

    const result = await runCompletePWTest(testCaseId, userId, options);

    if (!result.success) {
      return errorResponse(res, result.error, 400);
    }

    return successResponse(res, result.data, 'PW测试执行成功');

  } catch (error) {
    console.error('执行完整PW测试流程失败:', error);
    return serverErrorResponse(res, '执行PW测试失败');
  }
});

/**
 * 执行PW测试 - 使用MCP架构
 * POST /api/pw-test/execute/:testCaseId
 */
router.post('/execute/:testCaseId', authenticateToken, async (req, res) => {
  try {
    const { testCaseId } = req.params;
    const { options = {} } = req.body;
    const userId = req.user._id;

    console.log(`开始执行PW测试，测试用例ID: ${testCaseId}`);

    const result = await executePWTest(testCaseId, userId, options);

    if (!result.success) {
      return errorResponse(res, result.error, 400);
    }

    return successResponse(res, result.data, 'PW测试执行成功');

  } catch (error) {
    console.error('执行PW测试失败:', error);
    return serverErrorResponse(res, '执行PW测试失败');
  }
});


/**
 * 获取测试用例的PW测试状态
 * GET /api/pw-test/status/:testCaseId
 */
router.get('/status/:testCaseId', authenticateToken, async (req, res) => {
  try {
    const { testCaseId } = req.params;
    const userId = req.user._id;

    console.log(`获取PW测试状态，测试用例ID: ${testCaseId}`);

    // 获取测试用例
    const testCase = await TestCase.findOne({
      _id: testCaseId,
      memberId: userId
    }).select('pwTestConfig generatedCode intelligentAnalysis pwTestStatistics executionHistory');

    if (!testCase) {
      return errorResponse(res, '测试用例不存在或无权访问', 404);
    }

    // 获取最新的执行记录
    const latestExecution = testCase.executionHistory.length > 0 
      ? testCase.executionHistory[testCase.executionHistory.length - 1]
      : null;


    const status = {
      testCaseId,
      pwTestEnabled: testCase.pwTestConfig?.enabled || false,
      hasGeneratedCode: !!testCase.generatedCode?.fullScript,
      codeVersion: testCase.generatedCode?.version || null,
      lastGeneratedAt: testCase.generatedCode?.generatedAt || null,
      qualityScore: testCase.generatedCode?.qualityScore || 0,
      latestExecution: latestExecution ? {
        executionId: latestExecution.executionId,
        status: latestExecution.status,
        result: latestExecution.result,
        startedAt: latestExecution.startedAt,
        completedAt: latestExecution.completedAt,
        duration: latestExecution.duration
      } : null,
      statistics: testCase.pwTestStatistics,
      nluResult: testCase.intelligentAnalysis?.nluResult || null
    };

    return successResponse(res, status, '获取PW测试状态成功');

  } catch (error) {
    console.error('获取PW测试状态失败:', error);
    return serverErrorResponse(res, '获取PW测试状态失败');
  }
});

/**
 * 获取测试用例的执行历史
 * GET /api/pw-test/history/:testCaseId
 */
router.get('/history/:testCaseId', authenticateToken, async (req, res) => {
  try {
    const { testCaseId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    console.log(`获取PW测试执行历史，测试用例ID: ${testCaseId}`);

    // 获取测试用例
    const testCase = await TestCase.findOne({
      _id: testCaseId,
      memberId: userId
    }).select('executionHistory');

    if (!testCase) {
      return errorResponse(res, '测试用例不存在或无权访问', 404);
    }

    // 分页处理执行历史
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = testCase.executionHistory.length;
    const history = testCase.executionHistory
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
      .slice(skip, skip + parseInt(limit));

    return successResponse(res, {
      history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    }, '获取执行历史成功');

  } catch (error) {
    console.error('获取PW测试执行历史失败:', error);
    return serverErrorResponse(res, '获取执行历史失败');
  }
});



/**
 * 更新PW测试配置
 * PUT /api/pw-test/config/:testCaseId
 */
router.put('/config/:testCaseId', authenticateToken, async (req, res) => {
  try {
    const { testCaseId } = req.params;
    const { pwTestConfig } = req.body;
    const userId = req.user._id;

    console.log(`更新PW测试配置，测试用例ID: ${testCaseId}`);

    const testCase = await TestCase.findOneAndUpdate(
      {
        _id: testCaseId,
        memberId: userId
      },
      {
        $set: {
          pwTestConfig: pwTestConfig
        }
      },
      { new: true }
    );

    if (!testCase) {
      return errorResponse(res, '测试用例不存在或无权访问', 404);
    }

    return successResponse(res, testCase.pwTestConfig, 'PW测试配置更新成功');

  } catch (error) {
    console.error('更新PW测试配置失败:', error);
    return serverErrorResponse(res, '更新PW测试配置失败');
  }
});

export default router;
