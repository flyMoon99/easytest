import express from 'express';
import { successResponse, errorResponse, serverErrorResponse } from '../utils/response.js';
import { authenticateToken } from '../middleware/auth.js';
import TestCase from '../models/TestCase.js';
import { captureWebsiteScreenshot } from '../services/playwrightService.js';
import { analyzeScreenshotAndGenerateScripts, getAvailableModels } from '../services/aiService.js';
import { detectTestType, getAvailableTestTypes } from '../services/promptService.js';
import Joi from 'joi';

const router = express.Router();

// 验证模式
const createTestCaseSchema = Joi.object({
  title: Joi.string().min(5).max(100).required().messages({
    'string.min': '测试标题至少5个字符',
    'string.max': '测试标题最多100个字符',
    'any.required': '测试标题是必填项'
  }),
  entryUrl: Joi.string().uri().required().messages({
    'string.uri': '请输入有效的URL地址',
    'any.required': '测试入口URL是必填项'
  }),
  description: Joi.string().min(5).max(2000).required().messages({
    'string.min': '测试描述至少5个字符',
    'string.max': '测试描述最多2000个字符',
    'any.required': '测试内容描述是必填项'
  })
});

const updateTestCaseSchema = Joi.object({
  title: Joi.string().min(5).max(100).messages({
    'string.min': '测试标题至少5个字符',
    'string.max': '测试标题最多100个字符'
  }),
  entryUrl: Joi.string().uri().messages({
    'string.uri': '请输入有效的URL地址'
  }),
  description: Joi.string().min(5).max(2000).messages({
    'string.min': '测试描述至少5个字符',
    'string.max': '测试描述最多2000个字符'
  }),
  status: Joi.string().valid('pending', 'screened', 'analyzed', 'completed', 'failed').messages({
    'any.only': '状态值无效'
  })
});

/**
 * 创建测试用例
 * POST /api/testcases
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    // 验证请求数据
    const { error, value } = createTestCaseSchema.validate(req.body);
    if (error) {
      return errorResponse(res, error.details[0].message, 400);
    }

    const { title, entryUrl, description } = value;

    // 创建测试用例
    const testCase = new TestCase({
      memberId: req.user._id,
      title,
      entryUrl,
      description,
      status: 'pending'
    });

    await testCase.save();

    return successResponse(res, testCase, '测试用例创建成功', 201);
  } catch (error) {
    console.error('创建测试用例失败:', error);
    return serverErrorResponse(res, '创建测试用例失败');
  }
});

/**
 * 获取测试用例列表
 * GET /api/testcases
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const query = { memberId: req.user._id };
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // 查询测试用例
    const testCases = await TestCase.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // 获取总数
    const total = await TestCase.countDocuments(query);

    // 获取统计信息
    const statistics = await TestCase.getStatistics(req.user._id);

    return successResponse(res, {
      testCases,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      statistics
    }, '获取测试用例列表成功');
  } catch (error) {
    console.error('获取测试用例列表失败:', error);
    return serverErrorResponse(res, '获取测试用例列表失败');
  }
});

/**
 * 获取测试用例详情
 * GET /api/testcases/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const testCase = await TestCase.findOne({
      _id: id,
      memberId: req.user._id
    });

    if (!testCase) {
      return errorResponse(res, '测试用例不存在', 404);
    }

    return successResponse(res, testCase, '获取测试用例详情成功');
  } catch (error) {
    console.error('获取测试用例详情失败:', error);
    return serverErrorResponse(res, '获取测试用例详情失败');
  }
});

/**
 * 更新测试用例
 * PUT /api/testcases/:id
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 验证请求数据
    const { error, value } = updateTestCaseSchema.validate(req.body);
    if (error) {
      return errorResponse(res, error.details[0].message, 400);
    }

    const testCase = await TestCase.findOne({
      _id: id,
      memberId: req.user._id
    });

    if (!testCase) {
      return errorResponse(res, '测试用例不存在', 404);
    }

    // 如果测试正在执行中，不允许修改
    if (testCase.status === 'screened' || testCase.status === 'analyzed') {
      return errorResponse(res, '测试正在执行中，无法修改', 400);
    }

    // 更新测试用例
    Object.assign(testCase, value);
    testCase.updatedAt = new Date();
    await testCase.save();

    return successResponse(res, testCase, '测试用例更新成功');
  } catch (error) {
    console.error('更新测试用例失败:', error);
    return serverErrorResponse(res, '更新测试用例失败');
  }
});

/**
 * 删除测试用例
 * DELETE /api/testcases/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const testCase = await TestCase.findOne({
      _id: id,
      memberId: req.user._id
    });

    if (!testCase) {
      return errorResponse(res, '测试用例不存在', 404);
    }

    // 如果测试正在执行中，不允许删除
    if (testCase.status === 'screened' || testCase.status === 'analyzed') {
      return errorResponse(res, '测试正在执行中，无法删除', 400);
    }

    await TestCase.findByIdAndDelete(id);

    return successResponse(res, null, '测试用例删除成功');
  } catch (error) {
    console.error('删除测试用例失败:', error);
    return serverErrorResponse(res, '删除测试用例失败');
  }
});

/**
 * 更新测试用例状态
 * PATCH /api/testcases/:id/status
 */
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, result, screenshotUrl, videoUrl, playwrightScripts } = req.body;

    if (!['pending', 'screened', 'analyzed', 'completed', 'failed'].includes(status)) {
      return errorResponse(res, '无效的状态值', 400);
    }

    const testCase = await TestCase.findOne({
      _id: id,
      memberId: req.user._id
    });

    if (!testCase) {
      return errorResponse(res, '测试用例不存在', 404);
    }

    // 更新状态和相关数据
    const updateData = { status };
    if (result) updateData.result = result;
    if (screenshotUrl) updateData.screenshotUrl = screenshotUrl;
    if (videoUrl) updateData.videoUrl = videoUrl;
    if (playwrightScripts) updateData.playwrightScripts = playwrightScripts;

    await testCase.updateStatus(status, updateData);

    return successResponse(res, testCase, '测试用例状态更新成功');
  } catch (error) {
    console.error('更新测试用例状态失败:', error);
    return serverErrorResponse(res, '更新测试用例状态失败');
  }
});

/**
 * 获取测试统计信息
 * GET /api/testcases/statistics
 */
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    const statistics = await TestCase.getStatistics(req.user._id);
    return successResponse(res, statistics, '获取统计信息成功');
  } catch (error) {
    console.error('获取统计信息失败:', error);
    return serverErrorResponse(res, '获取统计信息失败');
  }
});

/**
 * 执行测试并截图
 * POST /api/testcases/:id/execute
 */
router.post('/:id/execute', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查找测试用例
    const testCase = await TestCase.findOne({
      _id: id,
      memberId: req.user._id
    });
    
    if (!testCase) {
      return errorResponse(res, '测试用例不存在', 404);
    }
    
    // 更新状态为已截图
    await testCase.updateStatus('screened');
    
    try {
      // 执行截图
      const screenshotResult = await captureWebsiteScreenshot(testCase.entryUrl, testCase._id.toString());
      
      if (!screenshotResult.success) {
        // 截图失败，更新状态为失败
        await testCase.updateStatus('failed', {
          result: {
            success: false,
            message: '截图失败',
            errorDetails: screenshotResult.error
          }
        });
        return errorResponse(res, `测试执行失败: ${screenshotResult.error}`, 500);
      }
      
      // 截图成功，更新测试用例状态为screened
      const updatedTestCase = await testCase.updateStatus('screened', {
        screenshotUrl: screenshotResult.screenshotPath,
        result: {
          success: true,
          message: '截图成功，等待AI解析',
          errorDetails: ''
        },
        playwrightScripts: [{
          step: 1,
          action: 'page.goto',
          value: testCase.entryUrl,
          description: '访问测试页面并截图',
          screenshot: screenshotResult.screenshotPath,
          timestamp: Date.now()
        }]
      });
      
      return successResponse(res, updatedTestCase, '测试执行成功');
      
    } catch (executeError) {
      console.error('测试执行过程中出错:', executeError);
      
      // 更新状态为失败
      await testCase.updateStatus('failed', {
        result: {
          success: false,
          message: '测试执行失败',
          errorDetails: executeError.message
        }
      });
      
      return serverErrorResponse(res, '测试执行失败');
    }
    
  } catch (error) {
    console.error('执行测试失败:', error);
    return serverErrorResponse(res, '执行测试失败');
  }
});

// AI分析截图并生成测试脚本
router.post('/:id/analyze', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { aiModel, testType } = req.body;
    
    // 查找测试用例
    const testCase = await TestCase.findById(id);
    if (!testCase) {
      return errorResponse(res, '测试用例不存在', 404);
    }
    
    // 检查是否有截图
    if (!testCase.screenshotUrl) {
      return errorResponse(res, '测试用例还没有截图，请先执行测试', 400);
    }
    
    // 更新状态为分析中
    await TestCase.findByIdAndUpdate(id, {
      status: 'analyzed',
      updatedAt: new Date()
    });
    
    console.log(`开始AI分析测试用例 ${id}`);
    
    // 智能检测测试类型（如果未指定）
    const finalTestType = testType || detectTestType(testCase.description);
    
    // 调用AI服务分析截图
    const analysisResult = await analyzeScreenshotAndGenerateScripts(
      testCase.screenshotUrl,
      testCase.description,
      aiModel || 'qwen-vl-max',
      finalTestType
    );
    
    if (analysisResult.success) {
      // 转换AI返回的脚本格式为数据库格式
      const playwrightScripts = analysisResult.playwrightScripts.map(script => ({
        step: script.step,
        description: script.description,
        action: script.action,
        selector: script.selector,
        value: script.value || '',
        explanation: script.explanation || ''
      }));
      
      // 确保analysis字段为字符串格式（数据库模型要求）
      const analysisText = Array.isArray(analysisResult.analysis) 
        ? JSON.stringify(analysisResult.analysis) 
        : String(analysisResult.analysis || '');
      
      // 更新测试用例状态为analyzed
      const updatedTestCase = await TestCase.findByIdAndUpdate(id, {
        status: 'analyzed',
        playwrightScripts: playwrightScripts,
        aiAnalysis: {
          analysis: analysisText,
          aiModel: aiModel || 'qwen',
          testType: finalTestType,
          analyzedAt: new Date()
        },
        updatedAt: new Date()
      }, { new: true });
      
      console.log(`AI分析完成，生成了 ${playwrightScripts.length} 个测试步骤`);
      
      return successResponse(res, {
        testCase: updatedTestCase,
        analysis: analysisResult.analysis,
        scripts: playwrightScripts,
        aiModel: aiModel || 'qwen',
        testType: finalTestType
      }, 'AI分析完成');
      
    } else {
      // AI分析失败，更新状态
      await TestCase.findByIdAndUpdate(id, {
        status: 'failed',
        result: {
          success: false,
          message: 'AI分析失败',
          errorDetails: analysisResult.error
        },
        updatedAt: new Date()
      });
      
      return errorResponse(res, analysisResult.error || 'AI分析失败', 500);
    }
    
  } catch (error) {
    console.error('AI分析失败:', error);
    
    // 提供更详细的错误信息
    let errorMessage = 'AI分析失败';
    let errorDetails = error.message;
    
    if (error.message.includes('超时')) {
      errorMessage = 'AI分析超时，请稍后重试';
      errorDetails = '请求超时，可能是网络延迟或图片处理时间过长';
    } else if (error.message.includes('网络连接')) {
      errorMessage = '网络连接错误';
      errorDetails = '无法连接到AI服务，请检查网络连接';
    } else if (error.message.includes('AI服务错误')) {
      errorMessage = 'AI服务暂时不可用';
      errorDetails = error.message;
    } else if (error.message.includes('截图文件不存在')) {
      errorMessage = '截图文件丢失';
      errorDetails = '无法找到截图文件，请重新上传';
    }
    
    // 更新状态为失败
    try {
      await TestCase.findByIdAndUpdate(req.params.id, {
        status: 'failed',
        result: {
          success: false,
          message: errorMessage,
          errorDetails: errorDetails
        },
        updatedAt: new Date()
      });
    } catch (updateError) {
      console.error('更新测试状态失败:', updateError);
    }
    
    return errorResponse(res, errorMessage, 500);
  }
});

// 获取可用的AI模型列表
router.get('/ai/models', authenticateToken, async (req, res) => {
  try {
    const models = getAvailableModels();
    return successResponse(res, { models }, '获取AI模型列表成功');
  } catch (error) {
    console.error('获取AI模型列表失败:', error);
    return serverErrorResponse(res, '获取AI模型列表失败');
  }
});

// 获取可用的测试类型列表
router.get('/ai/test-types', authenticateToken, async (req, res) => {
  try {
    const testTypes = getAvailableTestTypes();
    return successResponse(res, { testTypes }, '获取测试类型列表成功');
  } catch (error) {
    console.error('获取测试类型列表失败:', error);
    return serverErrorResponse(res, '获取测试类型列表失败');
  }
});

export default router;