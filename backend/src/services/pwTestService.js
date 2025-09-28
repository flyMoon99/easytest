import { analyzeWithQwen } from './aiService.js';
import mcpPlaywrightService from './mcpPlaywrightService.js';
import TestCase from '../models/TestCase.js';
import { getPrompt } from './promptService.js';
import { v4 as uuidv4 } from 'uuid';

// 截图功能已移至MCP架构中实现

/**
 * 检测测试用例是否需要登录
 * @param {Object} testCase - 测试用例对象
 * @returns {boolean} 是否需要登录
 */
const detectNeedLogin = (testCase) => {
  if (!testCase || !testCase.description) {
    return false;
  }
  
  const description = testCase.description.toLowerCase();
  const entryUrl = testCase.entryUrl ? testCase.entryUrl.toLowerCase() : '';
  
  // 检查描述中是否包含登录相关关键词
  const loginKeywords = ['登录', 'login', '登陆', 'signin', 'sign in', '账号', '密码', 'password', '用户名', 'username'];
  const hasLoginKeywords = loginKeywords.some(keyword => description.includes(keyword));
  
  // 检查URL是否指向需要登录的页面
  const isProtectedUrl = entryUrl.includes('/dashboard') || entryUrl.includes('/admin') || entryUrl.includes('/user');
  
  return hasLoginKeywords || isProtectedUrl;
};


/**
 * 执行PW测试 - 使用MCP架构
 */
export const executePWTest = async (testCaseId, userId, options = {}) => {
  try {
    console.log('开始执行MCP PW测试:', testCaseId);
    
    // 获取测试用例
    const testCase = await TestCase.findOne({
      _id: testCaseId,
      memberId: userId
    });
    
    if (!testCase) {
      throw new Error('测试用例不存在或无权访问');
    }
    
    // 创建执行记录
    const executionId = uuidv4();
    const executionRecord = {
      executionId,
      status: 'running',
      startedAt: new Date(),
      executor: 'mcp-system',
      codeVersion: 'mcp-1.0.0'
    };
    
    // 添加到执行历史
    testCase.executionHistory.push(executionRecord);
    await testCase.save();
    
    try {
      // 使用MCP执行测试
      const executionResult = await mcpPlaywrightService.executeTestCase(
        testCase,
        options
      );
      
      // 更新执行记录
      const executionIndex = testCase.executionHistory.findIndex(
        record => record.executionId === executionId
      );
      
      if (executionIndex !== -1) {
        testCase.executionHistory[executionIndex].status = 'completed';
        testCase.executionHistory[executionIndex].result = executionResult.success ? 'pass' : 'fail';
        testCase.executionHistory[executionIndex].completedAt = new Date();
        testCase.executionHistory[executionIndex].duration = 
          new Date() - testCase.executionHistory[executionIndex].startedAt;
        
        // 转换MCP执行步骤为日志格式
        if (executionResult.executionSteps) {
          testCase.executionHistory[executionIndex].logs = executionResult.executionSteps.map(step => ({
            level: step.error ? 'error' : 'info',
            message: step.error || `执行 ${step.action}`,
            timestamp: new Date(step.timestamp),
            step: step.step
          }));
        }
        
        if (executionResult.error) {
          testCase.executionHistory[executionIndex].error = {
            message: executionResult.error,
            stack: '',
            step: 0
          };
        }
      }
      
      // 更新统计信息
      updateTestStatistics(testCase, executionResult);
      
      await testCase.save();
      
      console.log('MCP PW测试执行完成');
      return {
        success: true,
        data: {
          executionId,
          result: executionResult,
          testCase: testCase
        }
      };
      
    } catch (executionError) {
      // 更新执行记录为失败
      const executionIndex = testCase.executionHistory.findIndex(
        record => record.executionId === executionId
      );
      
      if (executionIndex !== -1) {
        testCase.executionHistory[executionIndex].status = 'failed';
        testCase.executionHistory[executionIndex].result = 'fail';
        testCase.executionHistory[executionIndex].completedAt = new Date();
        testCase.executionHistory[executionIndex].error = {
          message: executionError.message,
          stack: executionError.stack
        };
      }
      
      await testCase.save();
      throw executionError;
    }
    
  } catch (error) {
    console.error('PW测试执行失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 代码执行功能已移至MCP架构中实现

/**
 * 更新测试统计信息
 */
const updateTestStatistics = (testCase, executionResult) => {
  const stats = testCase.pwTestStatistics || {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    averageExecutionTime: 0,
    minExecutionTime: 0,
    maxExecutionTime: 0,
    successRate: 0,
    codeGenerationCount: 0
  };
  
  stats.totalExecutions += 1;
  
  if (executionResult.success) {
    stats.successfulExecutions += 1;
  } else {
    stats.failedExecutions += 1;
  }
  
  // 计算成功率
  stats.successRate = stats.totalExecutions > 0 ? 
    Math.round((stats.successfulExecutions / stats.totalExecutions) * 100) : 0;
  
  stats.lastExecutedAt = new Date();
};

/**
 * 发送SSE事件
 */
const sendSSEEvent = (res, data) => {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};

/**
 * 流式执行完整的PW测试流程 - 使用MCP架构
 * @param {string} testCaseId - 测试用例ID
 * @param {string} userId - 用户ID
 * @param {Object} options - 执行选项
 * @param {Object} res - Express响应对象
 */
export const runStreamingPWTest = async (testCaseId, userId, options = {}, res) => {
  try {
    console.log('开始流式MCP PW测试流程:', { testCaseId, userId, options });
    
    // 发送开始事件
    sendSSEEvent(res, {
      type: 'start',
      message: '开始执行MCP PW测试流程',
      timestamp: new Date().toISOString()
    });

    // 1. 获取测试用例
    sendSSEEvent(res, {
      type: 'step',
      step: 'fetch_testcase',
      message: '正在获取测试用例...',
      progress: 10
    });

    const testCase = await TestCase.findOne({
      _id: testCaseId,
      memberId: userId
    });

    if (!testCase) {
      throw new Error('测试用例不存在或无权访问');
    }

    sendSSEEvent(res, {
      type: 'step_complete',
      step: 'fetch_testcase',
      message: `成功获取测试用例: ${testCase.title}`,
      progress: 20
    });

    // 2. 连接MCP服务器
    sendSSEEvent(res, {
      type: 'step',
      step: 'mcp_connect',
      message: '正在连接Playwright MCP服务器...',
      progress: 30
    });

    // 创建执行记录
    const executionId = uuidv4();
    const executionRecord = {
      executionId,
      status: 'running',
      startedAt: new Date(),
      executor: 'mcp-system',
      codeVersion: 'mcp-1.0.0'
    };
    
    testCase.executionHistory.push(executionRecord);
    await testCase.save();

    // 3. 执行MCP测试（带流式日志）
    sendSSEEvent(res, {
      type: 'step',
      step: 'mcp_execution',
      message: '开始执行MCP测试...',
      progress: 50
    });

    // 创建日志回调函数
    const logCallback = (message) => {
    sendSSEEvent(res, {
        type: 'log',
        message: message.replace('LOG: ', ''),
        timestamp: new Date().toISOString()
      });
    };

    const executionResult = await mcpPlaywrightService.executeTestCase(
      testCase,
      options,
      logCallback
    );

    // 更新执行记录
    const executionIndex = testCase.executionHistory.findIndex(
      record => record.executionId === executionId
    );
    
    if (executionIndex !== -1) {
      testCase.executionHistory[executionIndex].status = 'completed';
      testCase.executionHistory[executionIndex].result = executionResult.success ? 'pass' : 'fail';
      testCase.executionHistory[executionIndex].completedAt = new Date();
      testCase.executionHistory[executionIndex].duration = 
        new Date() - testCase.executionHistory[executionIndex].startedAt;
      
      if (executionResult.executionSteps) {
        testCase.executionHistory[executionIndex].logs = executionResult.executionSteps.map(step => ({
          level: step.error ? 'error' : 'info',
          message: step.error || `执行 ${step.action}`,
          timestamp: new Date(step.timestamp),
          step: step.step
        }));
      }
      
      if (executionResult.error) {
        testCase.executionHistory[executionIndex].error = {
          message: executionResult.error,
          stack: '',
          step: 0
        };
      }
    }

    // 更新统计信息
    updateTestStatistics(testCase, executionResult);
    await testCase.save();

    sendSSEEvent(res, {
      type: 'step_complete',
      step: 'mcp_execution',
      message: 'MCP测试执行完成',
      data: executionResult,
      progress: 95
    });

    // 7. 完成
    sendSSEEvent(res, {
      type: 'complete',
      message: 'PW测试流程执行完成',
      data: {
        executionId,
        result: executionResult,
        testCase: {
          id: testCase._id,
          title: testCase.title,
          status: executionResult.success ? 'completed' : 'failed'
        }
      },
      progress: 100,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('流式执行PW测试失败:', error);
    
    // 发送错误事件
    sendSSEEvent(res, {
      type: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
    
    throw error;
  }
};

/**
 * 完整的PW测试流程 - 使用MCP架构
 */
export const runCompletePWTest = async (testCaseId, userId, options = {}) => {
  try {
    console.log('开始完整MCP PW测试流程:', { testCaseId, userId, options });
    
    // 1. 获取测试用例
    console.log('查询测试用例，条件:', { _id: testCaseId, memberId: userId });
    const testCase = await TestCase.findOne({
      _id: testCaseId,
      memberId: userId
    });
    
    console.log('查询结果:', testCase ? '找到测试用例' : '未找到测试用例');
    
    if (!testCase) {
      // 尝试不限制memberId的查询，看看是否存在
      const testCaseWithoutMember = await TestCase.findById(testCaseId);
      if (testCaseWithoutMember) {
        console.log('测试用例存在但memberId不匹配:', {
          testCaseMemberId: testCaseWithoutMember.memberId,
          currentUserId: userId
        });
      }
      throw new Error('测试用例不存在或无权访问');
    }
    
    // 2. 直接使用MCP执行测试（无需代码生成步骤）
    console.log('开始MCP测试执行...');
    
    // 创建执行记录
    const executionId = uuidv4();
    const executionRecord = {
      executionId,
      status: 'running',
      startedAt: new Date(),
      executor: 'mcp-system',
      codeVersion: 'mcp-1.0.0'
    };
    
    testCase.executionHistory.push(executionRecord);
    
    // 更新执行模式配置
    if (options.executionMode || options.browserType) {
      const currentConfig = testCase.pwTestConfig || {
        enabled: false,
        executionMode: 'headless',
        browserType: 'chromium',
        viewport: { width: 1920, height: 1080 },
        timeouts: { navigation: 30000, action: 5000, assertion: 10000 },
        retries: { count: 3, delay: 1000 },
        recording: { enabled: true, video: true, screenshots: true }
      };
      
      if (options.executionMode) {
        currentConfig.executionMode = options.executionMode;
      }
      if (options.browserType) {
        currentConfig.browserType = options.browserType;
      }
      
      testCase.pwTestConfig = currentConfig;
    }
    
    await testCase.save();
    
    // 3. 执行MCP测试
    const executionResult = await mcpPlaywrightService.executeTestCase(
      testCase,
      options
    );
    
    // 更新执行记录
    const executionIndex = testCase.executionHistory.findIndex(
      record => record.executionId === executionId
    );
    
    if (executionIndex !== -1) {
      testCase.executionHistory[executionIndex].status = 'completed';
      testCase.executionHistory[executionIndex].result = executionResult.success ? 'pass' : 'fail';
      testCase.executionHistory[executionIndex].completedAt = new Date();
      testCase.executionHistory[executionIndex].duration = 
        new Date() - testCase.executionHistory[executionIndex].startedAt;
      
      if (executionResult.executionSteps) {
        testCase.executionHistory[executionIndex].logs = executionResult.executionSteps.map(step => ({
          level: step.error ? 'error' : 'info',
          message: step.error || `执行 ${step.action}`,
          timestamp: new Date(step.timestamp),
          step: step.step
        }));
      }
      
      if (executionResult.error) {
        testCase.executionHistory[executionIndex].error = {
          message: executionResult.error,
          stack: '',
          step: 0
        };
      }
    }
    
    // 更新统计信息
    updateTestStatistics(testCase, executionResult);
    await testCase.save();
    
    console.log('完整MCP PW测试流程完成');
    return {
      success: true,
      data: {
        executionId,
        executionResult,
        testCase
      }
    };
    
  } catch (error) {
    console.error('完整PW测试流程失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};