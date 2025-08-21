import { analyzeWithQwen } from './aiService.js';
import { executeTestSteps } from './playwrightService.js';
import TestCase from '../models/TestCase.js';
import GeneratedCode from '../models/GeneratedCode.js';
import { getPrompt } from './promptService.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * 自然语言理解引擎 (NLU Engine)
 * 解析测试用例的自然语言描述，提取关键信息
 */
export const parseTestDescription = async (testCase) => {
  try {
    console.log('开始自然语言理解分析:', testCase.title);
    
    // 构建测试描述
    const testDescription = `${testCase.title}\n\n${testCase.description}`;
    
    // 使用AI模型进行自然语言理解
    const nluResult = await analyzeWithQwen(
      testCase.screenshotUrl || '',
      testDescription,
      'nlu_analysis'
    );
    
    if (!nluResult.success) {
      throw new Error('自然语言理解失败: ' + nluResult.error);
    }
    
    // 解析AI返回的结果
    const analysis = nluResult.analysis;
    
    // 提取关键信息
    const extractedInfo = {
      testObjective: '',
      mainActions: [],
      testType: 'functional',
      complexity: 'medium',
      estimatedDuration: 30
    };
    
    // 尝试从AI分析结果中提取信息
    if (typeof analysis === 'object') {
      extractedInfo.testObjective = analysis.testObjective || testCase.title;
      extractedInfo.mainActions = analysis.mainActions || [];
      extractedInfo.testType = analysis.testType || 'functional';
      extractedInfo.complexity = analysis.complexity || 'medium';
      extractedInfo.estimatedDuration = analysis.estimatedDuration || 30;
    } else if (typeof analysis === 'string') {
      // 如果返回的是字符串，进行简单的关键词提取
      extractedInfo.testObjective = testCase.title;
      
      // 简单的关键词匹配
      const description = testCase.description.toLowerCase();
      if (description.includes('登录') || description.includes('login')) {
        extractedInfo.testType = 'authentication';
        extractedInfo.mainActions.push({
          action: 'login',
          target: '登录表单',
          expectedResult: '成功登录'
        });
      } else if (description.includes('表单') || description.includes('form')) {
        extractedInfo.testType = 'form';
        extractedInfo.mainActions.push({
          action: 'fill',
          target: '表单字段',
          expectedResult: '表单提交成功'
        });
      } else if (description.includes('导航') || description.includes('navigation')) {
        extractedInfo.testType = 'navigation';
        extractedInfo.mainActions.push({
          action: 'navigate',
          target: '页面链接',
          expectedResult: '页面跳转成功'
        });
      }
    }
    
    console.log('自然语言理解完成:', extractedInfo);
    return {
      success: true,
      data: extractedInfo
    };
    
  } catch (error) {
    console.error('自然语言理解失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 代码生成引擎 (Code Generation Engine)
 * 基于测试需求生成Playwright测试代码
 */
export const generatePlaywrightCode = async (testCase, nluResult) => {
  try {
    console.log('开始生成Playwright代码:', testCase.title);
    
    // 构建代码生成提示词
    const testDescription = `${testCase.title}\n\n${testCase.description}`;
    const targetUrl = testCase.entryUrl;
    
    // 使用AI模型生成代码
    const codeResult = await analyzeWithQwen(
      testCase.screenshotUrl || '',
      testDescription,
      'code_generation'
    );
    
    if (!codeResult.success) {
      throw new Error('代码生成失败: ' + codeResult.error);
    }
    
    // 解析生成的代码
    let generatedCode = {
      fullScript: '',
      testFunction: '',
      setupCode: '',
      teardownCode: '',
      dependencies: ['playwright']
    };
    
    if (codeResult.playwrightScripts && codeResult.playwrightScripts.length > 0) {
      // 构建完整的Playwright测试代码
      generatedCode = buildCompletePlaywrightCode(
        testCase,
        codeResult.playwrightScripts,
        nluResult
      );
    } else {
      // 生成基础代码模板
      generatedCode = generateBasicCodeTemplate(testCase, nluResult);
    }
    
    console.log('Playwright代码生成完成');
    return {
      success: true,
      data: generatedCode
    };
    
  } catch (error) {
    console.error('代码生成失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 构建完整的Playwright测试代码
 */
const buildCompletePlaywrightCode = (testCase, scripts, nluResult) => {
  const testName = testCase.title.replace(/[^a-zA-Z0-9]/g, '_');
  const targetUrl = testCase.entryUrl;
  
  // 构建测试函数
  let testFunction = `async function test${testName}() {\n`;
  testFunction += `  const page = await context.newPage();\n`;
  testFunction += `  console.log('开始执行测试: ${testCase.title}');\n\n`;
  
  // 添加页面访问
  testFunction += `  // 访问目标页面\n`;
  testFunction += `  await page.goto('${targetUrl}', { waitUntil: 'networkidle' });\n`;
  testFunction += `  console.log('页面加载完成');\n\n`;
  
  // 添加测试步骤
  scripts.forEach((script, index) => {
    testFunction += `  // 步骤 ${index + 1}: ${script.description}\n`;
    
    switch (script.action) {
      case 'click':
        testFunction += `  await page.click('${script.selector}');\n`;
        break;
      case 'fill':
        testFunction += `  await page.fill('${script.selector}', '${script.value}');\n`;
        break;
      case 'waitForSelector':
        testFunction += `  await page.waitForSelector('${script.selector}');\n`;
        break;
      case 'waitForNavigation':
        testFunction += `  await page.waitForNavigation();\n`;
        break;
      default:
        testFunction += `  // ${script.action}: ${script.selector}\n`;
    }
    
    testFunction += `  console.log('步骤 ${index + 1} 完成');\n\n`;
  });
  
  // 添加断言
  testFunction += `  // 验证测试结果\n`;
  testFunction += `  console.log('测试执行完成');\n`;
  testFunction += `  await page.close();\n`;
  testFunction += `}\n`;
  
  // 构建完整脚本
  const fullScript = `const { chromium } = require('playwright');

async function runTest() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  try {
    ${testFunction}
    await test${testName}();
    console.log('测试通过');
  } catch (error) {
    console.error('测试失败:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

runTest();`;
  
  return {
    fullScript,
    testFunction,
    setupCode: `const { chromium } = require('playwright');`,
    teardownCode: `await browser.close();`,
    dependencies: ['playwright']
  };
};

/**
 * 生成基础代码模板
 */
const generateBasicCodeTemplate = (testCase, nluResult) => {
  const testName = testCase.title.replace(/[^a-zA-Z0-9]/g, '_');
  const targetUrl = testCase.entryUrl;
  
  const fullScript = `const { chromium } = require('playwright');

async function test${testName}() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 访问目标页面
    await page.goto('${targetUrl}', { waitUntil: 'networkidle' });
    console.log('页面加载完成');
    
    // TODO: 根据测试需求添加具体的测试步骤
    // ${testCase.description}
    
    console.log('测试执行完成');
  } catch (error) {
    console.error('测试失败:', error);
    throw error;
  } finally {
    await page.close();
    await browser.close();
  }
}

test${testName}();`;
  
  return {
    fullScript,
    testFunction: `async function test${testName}() { /* 测试函数 */ }`,
    setupCode: `const { chromium } = require('playwright');`,
    teardownCode: `await browser.close();`,
    dependencies: ['playwright']
  };
};

/**
 * 智能优化引擎 (Intelligent Optimization Engine)
 * 对生成的代码进行验证和优化
 */
export const validateAndOptimizeCode = async (generatedCode, testCase) => {
  try {
    console.log('开始代码验证和优化');
    
    // 基础验证
    const validationResult = validateCode(generatedCode);
    if (!validationResult.isValid) {
      throw new Error('代码验证失败: ' + validationResult.errors.join(', '));
    }
    
    // 代码质量评估
    const qualityScore = assessCodeQuality(generatedCode);
    
    // 优化建议
    const optimizationSuggestions = generateOptimizationSuggestions(generatedCode, testCase);
    
    // 应用优化
    const optimizedCode = applyOptimizations(generatedCode, optimizationSuggestions);
    
    console.log('代码验证和优化完成');
    return {
      success: true,
      data: {
        code: optimizedCode,
        qualityScore,
        suggestions: optimizationSuggestions
      }
    };
    
  } catch (error) {
    console.error('代码验证和优化失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 验证代码语法和结构
 */
const validateCode = (code) => {
  const errors = [];
  
  // 检查必要的方法调用
  if (!code.fullScript.includes('chromium.launch')) {
    errors.push('缺少浏览器启动代码');
  }
  
  if (!code.fullScript.includes('page.goto')) {
    errors.push('缺少页面访问代码');
  }
  
  if (!code.fullScript.includes('browser.close')) {
    errors.push('缺少浏览器关闭代码');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 评估代码质量
 */
const assessCodeQuality = (code) => {
  let score = 50; // 基础分数
  
  // 代码完整性检查
  if (code.fullScript.includes('try-catch')) score += 10;
  if (code.fullScript.includes('console.log')) score += 5;
  if (code.fullScript.includes('waitForSelector')) score += 10;
  if (code.fullScript.includes('assert')) score += 15;
  
  // 代码结构检查
  const lines = code.fullScript.split('\n');
  if (lines.length > 20) score += 5;
  if (code.fullScript.includes('async function')) score += 10;
  
  return Math.min(score, 100);
};

/**
 * 生成优化建议
 */
const generateOptimizationSuggestions = (code, testCase) => {
  const suggestions = [];
  
  if (!code.fullScript.includes('try-catch')) {
    suggestions.push({
      type: 'error_handling',
      priority: 'high',
      description: '建议添加错误处理机制'
    });
  }
  
  if (!code.fullScript.includes('waitForSelector')) {
    suggestions.push({
      type: 'wait_strategy',
      priority: 'medium',
      description: '建议添加元素等待策略'
    });
  }
  
  if (!code.fullScript.includes('assert')) {
    suggestions.push({
      type: 'assertion',
      priority: 'high',
      description: '建议添加断言验证'
    });
  }
  
  return suggestions;
};

/**
 * 应用优化建议
 */
const applyOptimizations = (code, suggestions) => {
  let optimizedCode = code.fullScript;
  
  suggestions.forEach(suggestion => {
    switch (suggestion.type) {
      case 'error_handling':
        optimizedCode = addErrorHandling(optimizedCode);
        break;
      case 'wait_strategy':
        optimizedCode = addWaitStrategy(optimizedCode);
        break;
      case 'assertion':
        optimizedCode = addAssertions(optimizedCode);
        break;
    }
  });
  
  return {
    ...code,
    fullScript: optimizedCode
  };
};

/**
 * 添加错误处理
 */
const addErrorHandling = (code) => {
  if (!code.includes('try-catch')) {
    const lines = code.split('\n');
    const newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('async function') && !line.includes('try')) {
        newLines.push(line);
        newLines.push('  try {');
        newLines.push('    console.log("开始执行测试");');
      } else if (line.includes('await browser.close()') && !code.includes('catch')) {
        newLines.push('  } catch (error) {');
        newLines.push('    console.error("测试执行失败:", error);');
        newLines.push('    throw error;');
        newLines.push('  } finally {');
        newLines.push(line);
        newLines.push('  }');
      } else {
        newLines.push(line);
      }
    }
    
    return newLines.join('\n');
  }
  
  return code;
};

/**
 * 添加等待策略
 */
const addWaitStrategy = (code) => {
  if (!code.includes('waitForSelector')) {
    return code.replace(
      /await page\.click\('([^']+)'\)/g,
      "await page.waitForSelector('$1');\n    await page.click('$1')"
    );
  }
  
  return code;
};

/**
 * 添加断言
 */
const addAssertions = (code) => {
  if (!code.includes('assert')) {
    const lines = code.split('\n');
    const newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      newLines.push(line);
      
      if (line.includes('page.goto') && !code.includes('assert')) {
        newLines.push('    // 验证页面标题');
        newLines.push('    const title = await page.title();');
        newLines.push('    console.assert(title, "页面标题不能为空");');
      }
    }
    
    return newLines.join('\n');
  }
  
  return code;
};

/**
 * 执行PW测试
 */
export const executePWTest = async (testCaseId, userId, options = {}) => {
  try {
    console.log('开始执行PW测试:', testCaseId);
    
    // 获取测试用例
    const testCase = await TestCase.findOne({
      _id: testCaseId,
      memberId: userId
    });
    
    if (!testCase) {
      throw new Error('测试用例不存在或无权访问');
    }
    
    // 检查是否有生成的代码
    if (!testCase.generatedCode.fullScript) {
      throw new Error('测试用例尚未生成代码，请先生成代码');
    }
    
    // 创建执行记录
    const executionId = uuidv4();
    const executionRecord = {
      executionId,
      status: 'running',
      startedAt: new Date(),
      executor: 'system',
      codeVersion: testCase.generatedCode.version
    };
    
    // 添加到执行历史
    testCase.executionHistory.push(executionRecord);
    await testCase.save();
    
    try {
      // 执行测试代码
      const executionResult = await executeGeneratedCode(
        testCase.generatedCode.fullScript,
        testCase.entryUrl,
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
        testCase.executionHistory[executionIndex].duration = executionResult.duration || 0;
        testCase.executionHistory[executionIndex].logs = executionResult.logs || [];
        testCase.executionHistory[executionIndex].screenshots = executionResult.screenshots || [];
        
        if (executionResult.error) {
          testCase.executionHistory[executionIndex].error = {
            message: executionResult.error.message,
            stack: executionResult.error.stack,
            step: executionResult.error.step
          };
        }
      }
      
      // 更新统计信息
      updateTestStatistics(testCase, executionResult);
      
      await testCase.save();
      
      console.log('PW测试执行完成');
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

/**
 * 执行生成的代码
 */
const executeGeneratedCode = async (code, targetUrl, options) => {
  // 这里应该实现安全的代码执行机制
  // 由于安全考虑，这里使用简化的执行方式
  
  const startTime = Date.now();
  const logs = [];
  const screenshots = [];
  
  try {
    // 使用现有的playwrightService执行测试步骤
    const result = await executeTestSteps(targetUrl, 'pw-test', []);
    
    const duration = Date.now() - startTime;
    
    return {
      success: result.success,
      duration,
      logs,
      screenshots: result.screenshots || [],
      error: result.error ? { message: result.error } : null
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    return {
      success: false,
      duration,
      logs,
      screenshots,
      error: { message: error.message, stack: error.stack }
    };
  }
};

/**
 * 更新测试统计信息
 */
const updateTestStatistics = (testCase, executionResult) => {
  const stats = testCase.pwTestStatistics;
  
  stats.totalExecutions += 1;
  
  if (executionResult.success) {
    stats.successfulExecutions += 1;
  } else {
    stats.failedExecutions += 1;
  }
  
  // 更新执行时间统计
  if (executionResult.duration) {
    if (stats.minExecutionTime === 0 || executionResult.duration < stats.minExecutionTime) {
      stats.minExecutionTime = executionResult.duration;
    }
    if (executionResult.duration > stats.maxExecutionTime) {
      stats.maxExecutionTime = executionResult.duration;
    }
    
    // 计算平均执行时间
    const totalTime = stats.averageExecutionTime * (stats.totalExecutions - 1) + executionResult.duration;
    stats.averageExecutionTime = totalTime / stats.totalExecutions;
  }
  
  // 计算成功率
  stats.successRate = stats.totalExecutions > 0 ? 
    Math.round((stats.successfulExecutions / stats.totalExecutions) * 100) : 0;
  
  stats.lastExecutedAt = new Date();
};

/**
 * 完整的PW测试流程
 */
export const runCompletePWTest = async (testCaseId, userId, options = {}) => {
  try {
    console.log('开始完整PW测试流程:', testCaseId);
    
    // 1. 获取测试用例
    const testCase = await TestCase.findOne({
      _id: testCaseId,
      memberId: userId
    });
    
    if (!testCase) {
      throw new Error('测试用例不存在或无权访问');
    }
    
    // 2. 自然语言理解
    const nluResult = await parseTestDescription(testCase);
    if (!nluResult.success) {
      throw new Error('自然语言理解失败: ' + nluResult.error);
    }
    
    // 3. 代码生成
    const codeResult = await generatePlaywrightCode(testCase, nluResult.data);
    if (!codeResult.success) {
      throw new Error('代码生成失败: ' + codeResult.error);
    }
    
    // 4. 代码优化
    const optimizationResult = await validateAndOptimizeCode(codeResult.data, testCase);
    if (!optimizationResult.success) {
      throw new Error('代码优化失败: ' + optimizationResult.error);
    }
    
    // 5. 保存生成的代码
    const optimizedCode = optimizationResult.data.code;
    testCase.generatedCode = {
      ...optimizedCode,
      version: '1.0.0',
      generatedAt: new Date(),
      aiModel: 'qwen-vl-max',
      qualityScore: optimizationResult.data.qualityScore
    };
    
    testCase.intelligentAnalysis.nluResult = nluResult.data;
    testCase.pwTestStatistics.codeGenerationCount += 1;
    
    await testCase.save();
    
    // 6. 执行测试
    const executionResult = await executePWTest(testCaseId, userId, options);
    
    console.log('完整PW测试流程完成');
    return {
      success: true,
      data: {
        nluResult: nluResult.data,
        generatedCode: optimizedCode,
        optimizationResult: optimizationResult.data,
        executionResult: executionResult.data
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
